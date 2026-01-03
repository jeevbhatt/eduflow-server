import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import teacherService from "../services/teacher.service";

export const getProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const teacher = await teacherService.getTeacherProfile(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    res.status(200).json({
      message: "Teacher profile fetched successfully",
      data: teacher,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
