/**
 * Forgot Password Controller
 *
 * Handles password reset flow:
 * 1. User requests reset (sends email with token)
 * 2. User resets password with token
 */

import { Request, Response } from "express";
import prisma from "@core/database/prisma";
import crypto from "crypto";
import bcrypt from "bcrypt";
import sendMail from "@core/services/sendMail";

const OTP_EXPIRY_MINUTES = 10;
const BCRYPT_ROUNDS = 10;

/**
 * Request password reset - sends email with OTP
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, you will receive an OTP code to reset your password.",
      });
    }

    // Check if user signed up with OAuth (no password)
    if (user.googleId && !user.password) {
      return res.json({
        success: true,
        message: "Your account is linked to Google. Please sign in using Google.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const otpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store hashed OTP in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: otpHash,
        verificationExpires: otpExpires,
      },
    });

    // Build reset URL
    const frontendUrl = process.env.FRONTEND_URL || "https://eduflow.jeevanbhatt.com.np";
    const resetUrl = `${frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&otp=${otp}`;

    // Send email
    await sendMail({
      to: user.email,
      subject: "Password Reset OTP - EduFlow",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #1a1a2e; text-align: center;">Reset Your Password</h2>
          <p>Hi ${user.firstName || "there"},</p>
          <p>We received a request to reset your password for your EduFlow account. Use the OTP code below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f4f4f9; display: inline-block; padding: 15px 30px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a2e; border: 2px dashed #1a1a2e; border-radius: 8px;">
              ${otp}
            </div>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #1a1a2e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Click here to Reset Password
            </a>
          </div>
          <p style="color: #e63946; font-size: 14px; text-align: center;">This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ensure your account security or ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 11px; text-align: center;">© EduFlow - Your Education Management Platform</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "If an account exists with this email, you will receive an OTP code to reset your password.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
};

/**
 * Reset password with OTP
 * POST /auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        error: "Email, OTP, and new password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    // Hash the provided OTP
    const otpHash = crypto.createHash("sha256").update(otp.toString()).digest("hex");

    // Find user by email and valid OTP
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        verificationToken: otpHash,
        verificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP code. Please request a new one.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update user with new password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    res.json({
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
};
