import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const getProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const profile = await studentService.getStudentProfile(userId);
    res.json({ status: "success", data: profile });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};
