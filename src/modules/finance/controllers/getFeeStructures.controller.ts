import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import financeService from "../services/finance.service";

export const getFeeStructures = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const structures = await financeService.getFeeStructures(instituteId);
    res.json({ status: "success", data: structures });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
