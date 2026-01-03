import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const createResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    const userId = req.user?.id;
    if (!instituteId || !userId) throw new Error("Unauthorized");

    const resource = await libraryService.createResource(instituteId, userId, req.body, req.file);
    res.status(201).json({ status: "success", data: resource });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
