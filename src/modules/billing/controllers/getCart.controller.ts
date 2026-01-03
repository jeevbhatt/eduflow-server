import { Request, Response } from "express";
import billingService from "../services/billing.service";

export const getCart = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const cart = await billingService.getCart(studentId);
    res.json({
      status: "success",
      data: cart,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
