import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import teacherService from "../services/teacher.service";

export const updateProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const teacher = await teacherService.getTeacherProfile(userId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher profile not found" });
    }

    const updatedTeacher = await teacherService.updateTeacherProfile(teacher.id, req.body);
    res.status(200).json({
      message: "Teacher profile updated successfully",
      data: updatedTeacher,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
