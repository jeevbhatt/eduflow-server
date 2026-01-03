import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import analyticsService from "../services/analytics.service";

export const getAssessmentPerformance = async (req: IExtendedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const performance = await analyticsService.getAssessmentPerformance(courseId);
    res.status(200).json({
      message: "Assessment performance fetched successfully",
      data: performance,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
