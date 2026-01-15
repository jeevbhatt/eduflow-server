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
import { passwordResetEmail } from "@core/services/email-templates";

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
    const emailContent = passwordResetEmail(user.firstName || "User", user.email, otp);
    await sendMail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
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
