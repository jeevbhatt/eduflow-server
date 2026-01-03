import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import supportService from "../services/support.service";

export const createTicket = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.user?.currentInstituteNumber;
    if (!userId) throw new Error("User ID not found");

    const ticket = await supportService.createTicket({
      ...req.body,
      userId,
      instituteId,
    });
    res.status(201).json({ status: "success", data: ticket });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
