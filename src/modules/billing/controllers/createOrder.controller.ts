import { Request, Response } from "express";
import billingService from "../services/billing.service";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, ...orderData } = req.body;
    const order = await billingService.createOrder(
      {
        ...orderData,
        studentId: (req as any).user.id,
        instituteId: (req as any).instituteId,
      },
      items
    );
    res.status(201).json({
      status: "success",
      data: order,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
