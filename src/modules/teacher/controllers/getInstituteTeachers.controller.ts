import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import teacherService from "../services/teacher.service";

export const getInstituteTeachers = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute ID not found in session" });
    }

    const teachers = await teacherService.getAllTeachers(instituteId);
    res.status(200).json({
      message: "Teachers fetched successfully",
      data: teachers,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
