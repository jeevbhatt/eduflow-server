import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const updateResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const updated = await libraryService.updateResource(id, instituteId, req.body, req.file);
    res.json({ status: "success", data: updated });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
