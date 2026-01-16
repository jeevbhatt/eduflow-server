import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const getStudents = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const students = await studentService.getInstituteStudents(instituteId);
    res.json({ status: "success", data: students });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
