import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import instituteService from "../services/institute.service";

export const getMyInstitutes = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const institutes = await instituteService.getMyInstitutes(userId);
    res.json({ status: "success", data: institutes });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
