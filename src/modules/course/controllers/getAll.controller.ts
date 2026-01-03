import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import courseService from "../services/course.service";

export const getAll = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute ID not found" });
    }

    const courses = await courseService.getAllCourses(instituteId);
    res.status(200).json({
      message: "Courses fetched successfully",
      data: courses,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
