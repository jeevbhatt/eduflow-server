import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const getStudentById = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const student = await studentService.getStudentById(id, instituteId);
    res.json({ status: "success", data: student });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};
