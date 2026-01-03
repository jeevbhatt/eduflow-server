import { Request, Response } from "express";
import academicService from "../services/academic.service";

export const getAssessments = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const assessments = await academicService.getAssessments(courseId);
    res.json({
      status: "success",
      data: assessments,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
