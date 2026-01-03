import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import courseService from "../services/course.service";

export const getOne = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await courseService.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({
      message: "Course fetched successfully",
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
