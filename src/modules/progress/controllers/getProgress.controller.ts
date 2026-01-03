import { Request, Response } from "express";
import progressService from "../services/progress.service";

export const getProgress = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const studentId = (req as any).user.id;
    const progress = await progressService.getProgress(studentId, courseId);
    res.json({
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
