import { Request, Response } from "express";
import billingService from "../services/billing.service";

export const getOrders = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const orders = await billingService.getOrders(studentId);
    res.json({
      status: "success",
      data: orders,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
