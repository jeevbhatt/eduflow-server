import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import financeService from "../services/finance.service";

export const getFinanceStats = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const stats = await financeService.getFinanceStats(instituteId);
    res.json({ status: "success", data: stats });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
