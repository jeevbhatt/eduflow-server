import { Request, Response } from 'express';
import User from '../../../database/models/userModel';
import otpService from '../../../services/otpService';
import sendMail from '../../../services/sendMail';

// Extended request with user info
interface IExtendedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    currentInstituteNumber?: string;
  };
}

class VerificationController {
  /**
   * Send OTP to user's email
   * POST /api/auth/send-otp
   */
  public static sendEmailOTP = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      // Check if user exists (Vercel-style)
      const status = await otpService.getUserVerificationStatus(email);

      if (!status.exists) {
        return res.status(404).json({
          message: 'User not found. Please register first.',
          needsRegistration: true
        });
      }

      if (!status.needsEmailVerification) {
        return res.status(400).json({
          message: 'Email already verified',
          alreadyVerified: true
        });
      }

      // Check rate limiting
      const rateCheck = await otpService.canRequestOTP(status.userId!);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          message: rateCheck.message,
          waitSeconds: rateCheck.waitSeconds
        });
      }

      // Generate and store OTP
      const otpData = await otpService.createEmailOTP(status.userId!);
      if (!otpData) {
        return res.status(500).json({ message: 'Failed to generate verification code' });
      }

      // Send email with OTP
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verify Your Email</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otpData.otp}</span>
          </div>
          <p style="color: #6b7280;">This code expires in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `;

      await sendMail({
        to: email,
        subject: 'Verify Your Email - EduFlow',
        html: emailContent,
      });

      res.status(200).json({
        message: 'Verification code sent to your email',
        expiresAt: otpData.expiresAt,
        userId: status.userId
      });

    } catch (error: any) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: 'Failed to send verification code', error: error.message });
    }
  };

  /**
   * Verify email OTP
   * POST /api/auth/verify-otp
   */
  public static verifyEmailOTP = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const result = await otpService.verifyEmailOTP(user.id, otp);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({
        message: result.message,
        verified: true,
        redirectTo: '/dashboard'
      });

    } catch (error: any) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: 'Verification failed', error: error.message });
    }
  };

  /**
   * Resend OTP (with cooldown)
   * POST /api/auth/resend-otp
   */
  public static resendOTP = async (req: Request, res: Response) => {
    const { email, type = 'email' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check rate limiting
      const rateCheck = await otpService.canRequestOTP(user.id);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          message: rateCheck.message,
          waitSeconds: rateCheck.waitSeconds
        });
      }

      // Generate new OTP
      const otpData = type === 'phone'
        ? await otpService.createPhoneOTP(user.id)
        : await otpService.createEmailOTP(user.id);

      if (!otpData) {
        return res.status(500).json({ message: 'Failed to generate verification code' });
      }

      // Send OTP
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Verification Code</h2>
          <p>Your new verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otpData.otp}</span>
          </div>
          <p style="color: #6b7280;">This code expires in 10 minutes.</p>
        </div>
      `;

      await sendMail({
        to: email,
        subject: 'New Verification Code - EduFlow',
        html: emailContent,
      });

      res.status(200).json({
        message: 'New verification code sent',
        expiresAt: otpData.expiresAt
      });

    } catch (error: any) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: 'Failed to resend verification code', error: error.message });
    }
  };

  /**
   * Check verification status (for Vercel-style flow)
   * GET /api/auth/verification-status?email=xxx
   */
  public static checkVerificationStatus = async (req: Request, res: Response) => {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      const status = await otpService.getUserVerificationStatus(email);

      res.status(200).json({
        exists: status.exists,
        emailVerified: !status.needsEmailVerification,
        phoneVerified: !status.needsPhoneVerification,
        // Only return userId if they need to verify
        ...(status.needsEmailVerification && { userId: status.userId }),
      });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to check status', error: error.message });
    }
  };

  /**
   * Send phone OTP (for institute profile completion)
   * POST /api/auth/send-phone-otp
   */
  public static sendPhoneOTP = async (req: IExtendedRequest, res: Response) => {
    const { phone } = req.body;
    const userId = req.user?.id;

    if (!phone || !userId) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
      // Update user's phone number
      await User.update({ phone }, { where: { id: userId } });

      // Generate OTP
      const otpData = await otpService.createPhoneOTP(userId);
      if (!otpData) {
        return res.status(500).json({ message: 'Failed to generate verification code' });
      }

      // In production, send SMS here using Twilio/Nexmo
      // For now, we'll return success and log the OTP
      console.log(`Phone OTP for ${phone}: ${otpData.otp}`);

      res.status(200).json({
        message: 'Verification code sent to your phone',
        expiresAt: otpData.expiresAt,
        // Only in development
        ...(process.env.NODE_ENV === 'development' && { devOtp: otpData.otp })
      });

    } catch (error: any) {
      console.error('Send Phone OTP error:', error);
      res.status(500).json({ message: 'Failed to send verification code', error: error.message });
    }
  };

  /**
   * Verify phone OTP
   * POST /api/auth/verify-phone-otp
   */
  public static verifyPhoneOTP = async (req: IExtendedRequest, res: Response) => {
    const { otp } = req.body;
    const userId = req.user?.id;

    if (!otp || !userId) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    try {
      const result = await otpService.verifyPhoneOTP(userId, otp);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({
        message: result.message,
        verified: true
      });

    } catch (error: any) {
      console.error('Verify Phone OTP error:', error);
      res.status(500).json({ message: 'Verification failed', error: error.message });
    }
  };
}

export default VerificationController;
