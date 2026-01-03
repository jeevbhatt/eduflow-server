import { Request, Response } from "express";
import progressService from "../services/progress.service";

export const updateProgress = async (req: Request, res: Response) => {
  try {
    const progress = await progressService.updateProgress({
      ...req.body,
      studentId: (req as any).user.id,
      instituteId: (req as any).instituteId,
    });
    res.status(200).json({
      status: "success",
      data: progress,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
