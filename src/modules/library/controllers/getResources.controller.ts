import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const getResources = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const resources = await libraryService.getBooks(instituteId, req.query);
    res.json({ status: "success", data: resources });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
