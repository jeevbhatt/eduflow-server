import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import financeService from "../services/finance.service";

export const recordPayment = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const payment = await financeService.recordPayment(instituteId, req.body);
    res.status(201).json({ status: "success", data: payment });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
