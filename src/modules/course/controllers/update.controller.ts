import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import courseService from "../services/course.service";

export const update = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await courseService.updateCourse(id, req.body, req.file);
    res.status(200).json({
      message: "Course updated successfully",
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
