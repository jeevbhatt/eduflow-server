import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const deleteStudent = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    await studentService.deleteStudent(id, instituteId);
    res.json({ status: "success", message: "Student deleted" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
