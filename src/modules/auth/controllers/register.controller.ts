import { Request, Response } from "express";
import authService from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, schoolName, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Required fields (name, email, password) are missing"
      });
    }

    const { user, tokens } = await authService.register({
      name,
      email,
      password,
      schoolName
    });

    res.cookie("eduflow_auth_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
