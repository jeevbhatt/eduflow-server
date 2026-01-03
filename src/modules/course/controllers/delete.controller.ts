import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import courseService from "../services/course.service";

export const deleteCourse = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await courseService.deleteCourse(id);
    res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
