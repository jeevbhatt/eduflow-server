import { Request, Response } from "express";
import authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, schoolName, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Required fields (firstName, lastName, email, password) are missing"
      });
    }

    const { user, tokens } = await authService.register({
      firstName,
      lastName,
      email,
      password,
      schoolName
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = isProduction ? ".eduflow.jeevanbhatt.com.np" : undefined;

    res.cookie("eduflow_auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      domain: cookieDomain,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      domain: cookieDomain,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
