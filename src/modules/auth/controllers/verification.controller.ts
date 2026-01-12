import { Request, Response } from "express";
import authService, { AuthError } from "../services/auth.service";

/**
 * Verify email with token
 * POST /auth/verify-email
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Verification token is required",
      });
    }

    const result = await authService.verifyEmail(token);

    // Set cookies for auto-login
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = isProduction ? ".eduflow.jeevanbhatt.com.np" : undefined;

    res.cookie("eduflow_auth_token", result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      domain: cookieDomain,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      domain: cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: "success",
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        status: "error",
        code: error.code,
        message: error.message,
        data: error.data,
      });
    }

    res.status(400).json({
      status: "error",
      code: "VERIFICATION_FAILED",
      message: error.message || "Email verification failed",
    });
  }
};

/**
 * Resend verification email
 * POST /auth/resend-verification
 */
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Email is required",
      });
    }

    const result = await authService.resendVerification(email);

    res.status(200).json({
      status: "success",
      message: result.message,
      email: result.email,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        status: "error",
        code: error.code,
        message: error.message,
        data: error.data,
      });
    }

    res.status(400).json({
      status: "error",
      code: "RESEND_FAILED",
      message: error.message || "Failed to resend verification email",
    });
  }
};
