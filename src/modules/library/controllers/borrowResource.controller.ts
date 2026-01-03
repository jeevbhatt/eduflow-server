import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const borrowResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const { resourceId, studentId, dueDate } = req.body;
    const borrow = await libraryService.borrowResource(resourceId, studentId, instituteId, new Date(dueDate));
    res.json({ status: "success", data: borrow });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
