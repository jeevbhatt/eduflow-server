import { Request, Response } from "express";
import billingService from "../services/billing.service";

export const addToCart = async (req: Request, res: Response) => {
  try {
    const cartItem = await billingService.addToCart({
      studentId: (req as any).user.id,
      courseId: req.body.courseId,
      instituteId: (req as any).instituteId,
    });
    res.status(201).json({
      status: "success",
      data: cartItem,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
