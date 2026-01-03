import { Request, Response } from "express";
import instituteService from "../services/instituteService";

export const getMyInstitute = async (req: any, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber; // Assuming this is linked to user
    if (!instituteId) throw new Error("User not associated with an institute");

    const institute = await instituteService.getInstituteDetails(instituteId);
    res.json({ status: "success", data: institute });
  } catch (error: any) {
    res.status(404).json({ status: "error", message: error.message });
  }
};

export const updateMyInstitute = async (req: any, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("User not associated with an institute");

    const updated = await instituteService.updateInstitute(instituteId, req.body);
    res.json({ status: "success", data: updated });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};
