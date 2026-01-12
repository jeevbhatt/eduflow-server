import { Request, Response } from "express";
import authService, { AuthError } from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, instituteSlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Email and password are required",
      });
    }

    const result = await authService.login(email, password, instituteSlug);

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

    res.json({
      status: "success",
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      instituteSlug: result.instituteSlug,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    // Handle structured AuthError with specific codes
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        status: "error",
        code: error.code,
        message: error.message,
        data: error.data,
      });
    }

    res.status(401).json({
      status: "error",
      code: "LOGIN_FAILED",
      message: error.message || "Login failed",
    });
  }
};
