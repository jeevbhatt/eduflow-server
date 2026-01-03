import { Request, Response } from "express";
import User from "../../../database/models/userModel";
import * as bcrypt from "bcrypt";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";
import {
  generateTokenPair,
  generateAccessToken,
  generateMFAChallenge,
  verifyRefreshToken,
  verifyMFAChallenge,
  resolveMFAChallenge,
  blacklistToken,
  checkLoginAttempts,
  recordLoginAttempt,
  checkMFAAttempts,
  recordMFAAttempt,
  TokenPair,
} from "../../../services/secureTokenService";

// ============================================
// SECURE RESPONSE HELPERS
// ============================================

// Fields to NEVER include in responses
const SENSITIVE_FIELDS = ['password', 'mfaSecret', 'verificationToken', 'phoneVerificationToken'];

const sanitizeUser = (user: any) => {
  const sanitized = user.toJSON ? user.toJSON() : { ...user };
  SENSITIVE_FIELDS.forEach(field => delete sanitized[field]);
  return sanitized;
};

// ============================================
// AUTH CONTROLLER
// ============================================

class AuthController {
  /**
   * Register User
   * SECURITY: Password hashing, no sensitive data in response
   */
  public static registerUser = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, role } = req.body;

    // Input validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Please provide firstName, lastName, email and password",
        code: "MISSING_FIELDS"
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
        code: "WEAK_PASSWORD"
      });
    }

    try {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({
          message: "User already exists with this email",
          code: "EMAIL_EXISTS"
        });
      }

      // Use higher bcrypt rounds for security (12 is recommended)
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await User.create({
        firstName,
        lastName,
        email: email.toLowerCase(), // Normalize email
        password: hashedPassword,
        role: role || 'student'
      });

      // Return sanitized user data (no password)
      res.status(201).json({
        message: "User registered successfully",
        data: sanitizeUser(newUser)
      });
    } catch (err: any) {
      // Don't expose internal errors
      console.error('[AUTH] Registration error:', err);
      res.status(500).json({
        message: "Registration failed. Please try again.",
        code: "REGISTRATION_ERROR"
      });
    }
  };

  /**
   * Login User
   * SECURITY: Rate limiting, access/refresh tokens, MFA support
   */
  public static loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
        code: "MISSING_CREDENTIALS"
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check login attempts (rate limiting)
    const attemptCheck = checkLoginAttempts(normalizedEmail);
    if (!attemptCheck.allowed) {
      const retryAfter = attemptCheck.lockedUntil
        ? Math.ceil((attemptCheck.lockedUntil - Date.now()) / 1000)
        : 900; // 15 minutes default

      return res.status(429).json({
        message: "Too many login attempts. Please try again later.",
        code: "RATE_LIMITED",
        retryAfter
      });
    }

    try {
      const user = await User.findOne({ where: { email: normalizedEmail } });

      if (!user) {
        recordLoginAttempt(normalizedEmail, false);
        // Use same message for both cases (security: don't reveal if email exists)
        return res.status(401).json({
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
          remainingAttempts: attemptCheck.remainingAttempts - 1
        });
      }

      // Check account status
      if (user.accountStatus === 'suspended') {
        return res.status(403).json({
          message: "Account suspended. Please contact support.",
          code: "ACCOUNT_SUSPENDED"
        });
      }

      const isPasswordMatched = await bcrypt.compare(password, user.password);
      if (!isPasswordMatched) {
        recordLoginAttempt(normalizedEmail, false);
        return res.status(401).json({
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
          remainingAttempts: attemptCheck.remainingAttempts - 1
        });
      }

      // Record successful login (resets attempts)
      recordLoginAttempt(normalizedEmail, true);

      // If MFA is enabled, return challenge token (userId is NOT exposed)
      if (user.mfaEnabled) {
        const mfaChallengeToken = await generateMFAChallenge(user.id);

        return res.status(200).json({
          message: "MFA verification required",
          requireMfa: true,
          mfaChallenge: mfaChallengeToken // Encrypted challenge, not userId!
        });
      }

      // Generate token pair
      const tokens: TokenPair = await generateTokenPair({
        id: user.id,
        role: user.role,
        currentInstituteNumber: user.currentInstituteNumber
      });

      res.status(200).json({
        message: "Logged in successfully",
        data: {
          ...tokens,
          user: sanitizeUser(user)
        }
      });
    } catch (err: any) {
      console.error('[AUTH] Login error:', err);
      res.status(500).json({
        message: "Login failed. Please try again.",
        code: "LOGIN_ERROR"
      });
    }
  };

  /**
   * Refresh Token
   * SECURITY: Generate new access token from valid refresh token
   */
  public static refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token required",
        code: "MISSING_REFRESH_TOKEN"
      });
    }

    try {
      const { id, jti } = await verifyRefreshToken(refreshToken);

      const user = await User.findByPk(id, {
        attributes: ['id', 'role', 'currentInstituteNumber', 'accountStatus']
      });

      if (!user) {
        return res.status(401).json({
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      if (user.accountStatus === 'suspended') {
        // Blacklist the refresh token
        blacklistToken(jti);
        return res.status(403).json({
          message: "Account suspended",
          code: "ACCOUNT_SUSPENDED"
        });
      }

      // Generate new access token
      const accessToken = await generateAccessToken({
        id: user.id,
        role: user.role,
        currentInstituteNumber: user.currentInstituteNumber
      });

      res.status(200).json({
        accessToken,
        expiresIn: 15 * 60 // 15 minutes
      });
    } catch (err: any) {
      console.error('[AUTH] Token refresh error:', err.message);
      res.status(401).json({
        message: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN"
      });
    }
  };

  /**
   * Logout - Blacklist tokens
   */
  public static logout = async (req: any, res: Response) => {
    const { refreshToken } = req.body;

    try {
      if (refreshToken) {
        const { jti } = await verifyRefreshToken(refreshToken);
        blacklistToken(jti);
      }

      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      // Still return success even if token was invalid
      res.status(200).json({ message: "Logged out successfully" });
    }
  };

  /**
   * Setup MFA
   * SECURITY: Only for authenticated users
   */
  public static setupMfa = async (req: any, res: Response) => {
    const userId = req.user.id;

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(user.email, "EduFlow", secret);
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      // Temporarily store secret (will be confirmed on verification)
      user.mfaSecret = secret;
      await user.save();

      // Return QR code data (secret is stored, not returned for security)
      res.status(200).json({
        qrCodeUrl,
        // Optionally return secret for manual entry (some apps need this)
        manualEntryCode: secret
      });
    } catch (err: any) {
      console.error('[AUTH] MFA setup error:', err);
      res.status(500).json({
        message: "MFA setup failed",
        code: "MFA_SETUP_ERROR"
      });
    }
  };

  /**
   * Verify and Enable MFA
   * SECURITY: Validates TOTP before enabling
   */
  public static verifyAndEnableMfa = async (req: any, res: Response) => {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({
        message: "Invalid verification code format",
        code: "INVALID_CODE_FORMAT"
      });
    }

    try {
      const user = await User.findByPk(userId);
      if (!user || !user.mfaSecret) {
        return res.status(400).json({
          message: "MFA setup not initiated",
          code: "MFA_NOT_INITIATED"
        });
      }

      const isValid = authenticator.verify({ token, secret: user.mfaSecret });
      if (!isValid) {
        return res.status(400).json({
          message: "Invalid verification code",
          code: "INVALID_MFA_CODE"
        });
      }

      user.mfaEnabled = true;
      await user.save();

      res.status(200).json({
        message: "MFA enabled successfully",
        mfaEnabled: true
      });
    } catch (err: any) {
      console.error('[AUTH] MFA verification error:', err);
      res.status(500).json({
        message: "MFA verification failed",
        code: "MFA_VERIFICATION_ERROR"
      });
    }
  };

  /**
   * Finalize MFA Login
   * SECURITY: Rate limited, uses encrypted challenge tokens
   */
  public static finalizeMfaLogin = async (req: Request, res: Response) => {
    const { mfaChallenge, token } = req.body;

    if (!mfaChallenge || !token) {
      return res.status(400).json({
        message: "MFA challenge and token required",
        code: "MISSING_MFA_DATA"
      });
    }

    try {
      // Verify and decode challenge token
      const { challengeId } = await verifyMFAChallenge(mfaChallenge);

      // Check MFA attempt rate limit
      if (!checkMFAAttempts(challengeId)) {
        return res.status(429).json({
          message: "Too many MFA attempts. Please login again.",
          code: "MFA_RATE_LIMITED"
        });
      }

      // Resolve userId from challenge (never exposed to client)
      const userId = resolveMFAChallenge(challengeId);
      if (!userId) {
        return res.status(400).json({
          message: "MFA challenge expired. Please login again.",
          code: "MFA_CHALLENGE_EXPIRED"
        });
      }

      const user = await User.findByPk(userId);
      if (!user || !user.mfaSecret) {
        return res.status(400).json({
          message: "Invalid MFA configuration",
          code: "INVALID_MFA_CONFIG"
        });
      }

      const isValid = authenticator.verify({ token, secret: user.mfaSecret });

      if (!isValid) {
        recordMFAAttempt(challengeId, false);
        return res.status(400).json({
          message: "Invalid verification code",
          code: "INVALID_MFA_CODE"
        });
      }

      // MFA successful
      recordMFAAttempt(challengeId, true);

      // Generate token pair
      const tokens: TokenPair = await generateTokenPair({
        id: user.id,
        role: user.role,
        currentInstituteNumber: user.currentInstituteNumber
      });

      res.status(200).json({
        message: "Logged in successfully",
        data: {
          ...tokens,
          user: sanitizeUser(user)
        }
      });
    } catch (err: any) {
      console.error('[AUTH] MFA finalization error:', err);
      res.status(400).json({
        message: "MFA verification failed",
        code: "MFA_VERIFICATION_FAILED"
      });
    }
  };

  /**
   * Get Profile
   * SECURITY: Authenticated, sanitized response
   */
  public static getProfile = async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role',
                     'currentInstituteNumber', 'profileImage', 'phone',
                     'bio', 'mfaEnabled', 'emailVerified', 'phoneVerified']
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      res.status(200).json({
        message: "Profile fetched",
        data: sanitizeUser(user)
      });
    } catch (err: any) {
      console.error('[AUTH] Profile fetch error:', err);
      res.status(500).json({
        message: "Failed to fetch profile",
        code: "PROFILE_FETCH_ERROR"
      });
    }
  };

  /**
   * Update Profile
   * SECURITY: Only allowed fields, authenticated
   */
  public static updateProfile = async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      // Whitelist allowed fields (prevent mass assignment)
      const { firstName, lastName, phone, bio } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      // Only update provided fields
      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;
      if (bio !== undefined) updates.bio = bio;

      await User.update(updates, { where: { id: userId } });

      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role',
                     'currentInstituteNumber', 'profileImage', 'phone', 'bio']
      });

      res.status(200).json({
        message: "Profile updated successfully",
        data: sanitizeUser(updatedUser)
      });
    } catch (err: any) {
      console.error('[AUTH] Profile update error:', err);
      res.status(500).json({
        message: "Failed to update profile",
        code: "PROFILE_UPDATE_ERROR"
      });
    }
  };

  /**
   * Upload Profile Image
   * SECURITY: File validation should be done in multer middleware
   */
  public static uploadProfileImage = async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      const profileImage = req.file ? req.file.path : req.body.profileImage;

      if (!profileImage) {
        return res.status(400).json({
          message: "Profile image is required",
          code: "MISSING_IMAGE"
        });
      }

      await User.update({ profileImage }, { where: { id: userId } });

      res.status(200).json({
        message: "Profile image updated successfully",
        profileImage
      });
    } catch (err: any) {
      console.error('[AUTH] Image upload error:', err);
      res.status(500).json({
        message: "Failed to upload image",
        code: "IMAGE_UPLOAD_ERROR"
      });
    }
  };

  /**
   * Disable MFA
   * SECURITY: Requires password confirmation
   */
  public static disableMfa = async (req: any, res: Response) => {
    const userId = req.user?.id;
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({
        message: "Password and MFA token required",
        code: "MISSING_CREDENTIALS"
      });
    }

    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND"
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid password",
          code: "INVALID_PASSWORD"
        });
      }

      // Verify MFA token
      if (!user.mfaSecret) {
        return res.status(400).json({
          message: "MFA is not enabled",
          code: "MFA_NOT_ENABLED"
        });
      }

      const isValid = authenticator.verify({ token, secret: user.mfaSecret });
      if (!isValid) {
        return res.status(400).json({
          message: "Invalid MFA token",
          code: "INVALID_MFA_TOKEN"
        });
      }

      // Disable MFA
      user.mfaEnabled = false;
      user.mfaSecret = undefined as any; // Clear the secret
      await user.save();

      res.status(200).json({
        message: "MFA disabled successfully"
      });
    } catch (err: any) {
      console.error('[AUTH] MFA disable error:', err);
      res.status(500).json({
        message: "Failed to disable MFA",
        code: "MFA_DISABLE_ERROR"
      });
    }
  };
}

export default AuthController;
