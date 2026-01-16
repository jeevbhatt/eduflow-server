import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import financeService from "../services/finance.service";

export const createFeeStructure = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const structure = await financeService.createFeeStructure(instituteId, req.body);
    res.status(201).json({ status: "success", data: structure });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
