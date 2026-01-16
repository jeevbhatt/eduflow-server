import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const returnResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const { borrowId } = req.body;
    await libraryService.returnResource(borrowId, instituteId);
    res.json({ status: "success", message: "Resource returned successfully" });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
