import crypto from 'crypto';
import User from '../database/models/userModel';

/**
 * OTP Service - Handles generation, verification, and rate limiting of OTPs
 * Implements Vercel-style verification: record created immediately, same email → OTP page
 */

// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS_PER_HOUR = 3;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generate a cryptographically secure OTP
 */
export const generateOTP = (): string => {
  // Generate 6-digit OTP using crypto for security
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

/**
 * Hash OTP for secure storage
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify OTP against stored hash
 */
export const verifyOTPHash = (otp: string, hashedOtp: string): boolean => {
  const hashedInput = hashOTP(otp);
  return crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(hashedOtp));
};

/**
 * Check if user can request new OTP (rate limiting)
 */
export const canRequestOTP = async (userId: string): Promise<{ allowed: boolean; message?: string; waitSeconds?: number }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { allowed: false, message: 'User not found' };
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check if too many attempts in the last hour
  if (user.verificationAttempts >= MAX_ATTEMPTS_PER_HOUR && user.lastVerificationSent && user.lastVerificationSent > oneHourAgo) {
    const resetTime = new Date(user.lastVerificationSent.getTime() + 60 * 60 * 1000);
    const waitSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
    return {
      allowed: false,
      message: 'Too many attempts. Please try again later.',
      waitSeconds
    };
  }

  // Check cooldown between resends
  if (user.lastVerificationSent) {
    const cooldownEnd = new Date(user.lastVerificationSent.getTime() + RESEND_COOLDOWN_SECONDS * 1000);
    if (now < cooldownEnd) {
      const waitSeconds = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 1000);
      return {
        allowed: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        waitSeconds
      };
    }
  }

  // Reset attempts if hour has passed
  if (user.lastVerificationSent && user.lastVerificationSent < oneHourAgo) {
    await user.update({ verificationAttempts: 0 });
  }

  return { allowed: true };
};

/**
 * Create and store OTP for email verification
 */
export const createEmailOTP = async (userId: string): Promise<{ otp: string; expiresAt: Date } | null> => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const otp = generateOTP();
  const hashedOtp = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await user.update({
    verificationToken: hashedOtp,
    verificationExpires: expiresAt,
    verificationAttempts: (user.verificationAttempts || 0) + 1,
    lastVerificationSent: new Date(),
  });

  return { otp, expiresAt };
};

/**
 * Create and store OTP for phone verification
 */
export const createPhoneOTP = async (userId: string): Promise<{ otp: string; expiresAt: Date } | null> => {
  const user = await User.findByPk(userId);
  if (!user) return null;

  const otp = generateOTP();
  const hashedOtp = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await user.update({
    phoneVerificationToken: hashedOtp,
    phoneVerificationExpires: expiresAt,
  });

  return { otp, expiresAt };
};

/**
 * Verify email OTP
 */
export const verifyEmailOTP = async (userId: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.verificationToken || !user.verificationExpires) {
    return { success: false, message: 'No verification pending. Please request a new code.' };
  }

  // Check expiry
  if (new Date() > user.verificationExpires) {
    return { success: false, message: 'Verification code expired. Please request a new one.' };
  }

  // Verify OTP
  try {
    const isValid = verifyOTPHash(otp, user.verificationToken);
    if (!isValid) {
      return { success: false, message: 'Invalid verification code.' };
    }
  } catch {
    return { success: false, message: 'Invalid verification code.' };
  }

  // Success - mark email as verified
  await user.update({
    emailVerified: true,
    accountStatus: 'active',
    verificationToken: null,
    verificationExpires: null,
    verificationAttempts: 0,
  });

  return { success: true, message: 'Email verified successfully!' };
};

/**
 * Verify phone OTP
 */
export const verifyPhoneOTP = async (userId: string, otp: string): Promise<{ success: boolean; message: string }> => {
  const user = await User.findByPk(userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (!user.phoneVerificationToken || !user.phoneVerificationExpires) {
    return { success: false, message: 'No phone verification pending.' };
  }

  if (new Date() > user.phoneVerificationExpires) {
    return { success: false, message: 'Verification code expired.' };
  }

  try {
    const isValid = verifyOTPHash(otp, user.phoneVerificationToken);
    if (!isValid) {
      return { success: false, message: 'Invalid verification code.' };
    }
  } catch {
    return { success: false, message: 'Invalid verification code.' };
  }

  await user.update({
    phoneVerified: true,
    phoneVerificationToken: null,
    phoneVerificationExpires: null,
  });

  return { success: true, message: 'Phone verified successfully!' };
};

/**
 * Check if user needs verification (Vercel-style redirect)
 */
export const getUserVerificationStatus = async (email: string): Promise<{
  exists: boolean;
  needsEmailVerification: boolean;
  needsPhoneVerification: boolean;
  userId?: string;
}> => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    return { exists: false, needsEmailVerification: true, needsPhoneVerification: true };
  }

  return {
    exists: true,
    needsEmailVerification: !user.emailVerified,
    needsPhoneVerification: !user.phoneVerified,
    userId: user.id,
  };
};

export default {
  generateOTP,
  hashOTP,
  verifyOTPHash,
  canRequestOTP,
  createEmailOTP,
  createPhoneOTP,
  verifyEmailOTP,
  verifyPhoneOTP,
  getUserVerificationStatus,
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
};
