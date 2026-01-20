import bcrypt from "bcryptjs";
import * as jose from "jose";
import authRepo from "../repository/auth.repo";
import instituteRepo from "../../institute/repository/institute.repo";
import sendMail from "@core/services/sendMail";
import { verificationEmail, resendVerificationEmail, emailVerifiedSuccessEmail } from "@core/services/email-templates";
import { JWT_CONFIG, JWT_SECRET_UINT8, JWT_REFRESH_SECRET_UINT8 } from "@core/config/jwt.config";

// Custom error types for better client-side handling
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public data?: any
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class AuthService {
  constructor() {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(payload: any) {
    console.log("[Auth Debug] Generating token. Secret length:", JWT_SECRET_UINT8.length);

    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_CONFIG.ACCESS_EXPIRATION)
      .sign(JWT_SECRET_UINT8);

    const refreshToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_CONFIG.REFRESH_EXPIRATION)
      .sign(JWT_REFRESH_SECRET_UINT8);

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string, instituteSlug?: string) {
    const user = await authRepo.findByEmail(email);

    // Check if email exists - provide helpful error
    if (!user) {
      throw new AuthError(
        "No account found with this email. Please register first.",
        "EMAIL_NOT_FOUND",
        404
      );
    }

    // Check password
    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new AuthError(
        "Invalid password. Please try again.",
        "INVALID_PASSWORD",
        401
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new AuthError(
        "Please verify your email address before logging in.",
        "EMAIL_NOT_VERIFIED",
        403,
        { email: user.email, firstName: user.firstName }
      );
    }

    // Check account status
    if (user.accountStatus === "suspended") {
      throw new AuthError(
        "Your account has been suspended. Please contact support.",
        "ACCOUNT_SUSPENDED",
        403
      );
    }

    // Check institute membership if slug is provided (subdomain lock)
    if (instituteSlug) {
      const isOwner = user.ownedInstitutes?.some((i: any) => i.subdomain === instituteSlug);
      const isStudent = user.studentProfiles?.some((p: any) => p.institute.subdomain === instituteSlug);
      const isTeacher = user.teacherProfiles?.some((p: any) => p.institute.subdomain === instituteSlug);

      if (!isOwner && !isStudent && !isTeacher) {
        throw new AuthError(
          "You do not have access to this institute's portal.",
          "INSTITUTE_ACCESS_DENIED",
          403
        );
      }
    }

    const tokens = await this.generateTokens({ id: user.id, email: user.email, role: user.role });

    // Update last login
    await authRepo.updateLastLogin(user.id);

    // Remove sensitive data
    const { password: _, verificationToken: __, ...safeUser } = user;

    // Get primary institute info for redirection
    const primaryInstitute = user.ownedInstitutes?.[0] ||
                           user.studentProfiles?.[0]?.institute ||
                           user.teacherProfiles?.[0]?.institute;

    return {
      user: safeUser,
      instituteSlug: primaryInstitute?.subdomain,
      ...tokens
    };
  }

  async register(data: any) {
    // Check if email already exists
    const existingUser = await authRepo.findByEmail(data.email);
    if (existingUser) {
      // Check if already verified
      if (existingUser.emailVerified) {
        throw new AuthError(
          "An account with this email already exists. Please login instead.",
          "EMAIL_EXISTS",
          409
        );
      } else {
        // Account exists but not verified - allow resend
        throw new AuthError(
          "An account with this email exists but is not verified. Check your inbox or resend verification.",
          "EMAIL_EXISTS_UNVERIFIED",
          409,
          { email: existingUser.email, canResend: true }
        );
      }
    }

    // Check if institute subdomain would conflict (only for institute owners)
    if (data.role === "institute" && data.schoolName) {
      const proposedSubdomain = data.schoolName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const existingInstitute = await instituteRepo.findBySubdomainPrefix(proposedSubdomain);
      if (existingInstitute) {
        throw new AuthError(
          "An institute with a similar name already exists. Please choose a different name.",
          "INSTITUTE_EXISTS",
          409
        );
      }
    }

    // Validate role
    const allowedRoles = ["institute", "student", "teacher"];
    const userRole = data.role && allowedRoles.includes(data.role) ? data.role : "student";

    const hashedPassword = await this.hashPassword(data.password);

    // Create User with pending verification status
    const user = await authRepo.createWithProfile({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: userRole,
      emailVerified: false,
      accountStatus: "pending_verification",
    });

    // Generate verification token
    const verificationToken = await authRepo.setVerificationToken(user.id);

    // Create Institute ONLY if role is 'institute' and schoolName is provided
    if (userRole === "institute" && data.schoolName) {
      const subdomain = data.schoolName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
      const instituteNumber = "INST-" + Math.floor(100000 + Math.random() * 900000).toString();

      await instituteRepo.create({
        instituteName: data.schoolName,
        email: data.email,
        ownerId: user.id,
        subdomain: subdomain,
        instituteNumber: instituteNumber,
        accountStatus: "trial",
      });
    }

    // Send verification email
    const emailContent = verificationEmail(data.firstName || "User", verificationToken);
    await sendMail({
      to: data.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Remove sensitive data from response
    const { password: _, verificationToken: __, ...safeUser } = user;

    return {
      user: safeUser,
      message: "Registration successful! Please check your email to verify your account.",
      requiresVerification: true,
    };
  }

  async verifyEmail(token: string) {
    const user = await authRepo.findByVerificationToken(token);

    if (!user) {
      throw new AuthError(
        "Invalid or expired verification link. Please request a new one.",
        "INVALID_TOKEN",
        400
      );
    }

    // Check if token is expired
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      throw new AuthError(
        "This verification link has expired. Please request a new one.",
        "TOKEN_EXPIRED",
        400,
        { email: user.email, canResend: true }
      );
    }

    // Already verified?
    if (user.emailVerified) {
      throw new AuthError(
        "Your email is already verified. You can login.",
        "ALREADY_VERIFIED",
        400
      );
    }

    // Verify the email
    const verifiedUser = await authRepo.verifyEmail(user.id);

    // Send success email
    const emailContent = emailVerifiedSuccessEmail(user.firstName || "User");
    await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Generate tokens for auto-login
    const tokens = await this.generateTokens({
      id: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
    });

    const { password: _, verificationToken: __, ...safeUser } = verifiedUser;

    return {
      user: safeUser,
      ...tokens,
      message: "Email verified successfully! You are now logged in.",
    };
  }

  async resendVerification(email: string) {
    const user = await authRepo.findByEmail(email);

    if (!user) {
      throw new AuthError(
        "No account found with this email.",
        "EMAIL_NOT_FOUND",
        404
      );
    }

    if (user.emailVerified) {
      throw new AuthError(
        "Your email is already verified. You can login.",
        "ALREADY_VERIFIED",
        400
      );
    }

    // Check rate limiting
    const canResend = await authRepo.canResendVerification(email);
    if (!canResend.allowed) {
      if (canResend.waitSeconds) {
        throw new AuthError(
          `Please wait ${canResend.waitSeconds} seconds before requesting another verification email.`,
          "RATE_LIMITED",
          429,
          { waitSeconds: canResend.waitSeconds }
        );
      }
      throw new AuthError(
        "Unable to send verification email. Please try again later.",
        "RESEND_FAILED",
        400
      );
    }

    // Generate new token and send email
    const verificationToken = await authRepo.setVerificationToken(user.id);
    const emailContent = resendVerificationEmail(user.firstName || "User", verificationToken);

    await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return {
      message: "Verification email sent! Please check your inbox.",
      email: user.email,
    };
  }
}

export default new AuthService();
