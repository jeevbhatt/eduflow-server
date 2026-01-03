import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const deleteResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    await libraryService.deleteResource(id, instituteId);
    res.json({ status: "success", message: "Resource deleted" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
