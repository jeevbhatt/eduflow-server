import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import financeService from "../services/finance.service";

export const getStudentPayments = async (req: IExtendedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const payments = await financeService.getStudentPayments(studentId, instituteId);
    res.json({ status: "success", data: payments });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
