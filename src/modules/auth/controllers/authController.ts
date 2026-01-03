import { Request, Response } from "express";
import authService from "../services/authService";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      status: "success",
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        accessToken: result.accessToken,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      status: "error",
      message: error.message,
    });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.json({ status: "success", message: "Logged out successfully" });
};
