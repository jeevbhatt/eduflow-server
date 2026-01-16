import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import courseService from "../services/course.service";

export const create = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute context required" });
    }

    const course = await courseService.createCourse(
      { ...req.body, instituteId },
      req.file
    );
    res.status(201).json({
      message: "Course created successfully",
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
