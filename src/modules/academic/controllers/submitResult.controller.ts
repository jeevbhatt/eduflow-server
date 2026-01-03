import { Request, Response } from "express";
import academicService from "../services/academic.service";

export const submitResult = async (req: Request, res: Response) => {
  try {
    const result = await academicService.submitResult({
      ...req.body,
      instituteId: (req as any).instituteId,
    });
    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
