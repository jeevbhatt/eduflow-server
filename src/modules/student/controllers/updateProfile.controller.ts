import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const updateProfile = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await studentService.updateStudent(id, req.body, req.file);
    res.json({ status: "success", data: updated });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
