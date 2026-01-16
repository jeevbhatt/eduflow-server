import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const deleteResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    await libraryService.deleteResource(id, instituteId);
    res.json({ status: "success", message: "Resource deleted" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
