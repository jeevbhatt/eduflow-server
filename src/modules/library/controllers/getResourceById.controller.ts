import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import libraryService from "../services/library.service";

export const getResourceById = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const resource = await libraryService.getResourceById(id, instituteId);
    res.json({ status: "success", data: resource });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};
