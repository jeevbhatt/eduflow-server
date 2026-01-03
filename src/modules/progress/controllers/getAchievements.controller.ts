import { Request, Response } from "express";
import progressService from "../services/progress.service";

export const getAchievements = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const achievements = await progressService.getAchievements(studentId);
    res.json({
      status: "success",
      data: achievements,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
