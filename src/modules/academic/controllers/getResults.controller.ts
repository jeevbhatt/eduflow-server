import { Request, Response } from "express";
import academicService from "../services/academic.service";

export const getResults = async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const results = await academicService.getResults(assessmentId);
    res.json({
      status: "success",
      data: results,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
