import { Request, Response } from "express";
import academicService from "../services/academic.service";

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const assessment = await academicService.createAssessment({
      ...req.body,
      instituteId: (req as any).instituteId,
    });
    res.status(201).json({
      status: "success",
      data: assessment,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
