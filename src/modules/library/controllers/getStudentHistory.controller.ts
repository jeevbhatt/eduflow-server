import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const getStudentHistory = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const history = await libraryService.getStudentHistory(studentId, instituteId);
    res.json({ status: "success", data: history });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
