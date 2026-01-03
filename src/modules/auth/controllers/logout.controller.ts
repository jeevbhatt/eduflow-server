import { Request, Response } from "express";

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.json({ status: "success", message: "Logged out successfully" });
};
