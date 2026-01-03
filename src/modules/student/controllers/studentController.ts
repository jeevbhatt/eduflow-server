import { Response } from "express";
import studentService from "../services/studentService";

export const getProfile = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const profile = await studentService.getStudentProfile(userId);
    res.json({ status: "success", data: profile });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const studentId = req.params.id; // or from body/user
    const updated = await studentService.updateStudent(studentId, req.body);
    res.json({ status: "success", data: updated });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
