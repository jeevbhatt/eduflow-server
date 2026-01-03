import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import supportService from "../services/support.service";

export const getMyTickets = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const tickets = await supportService.getMyTickets(userId, req.query);
    res.json({ status: "success", data: tickets });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
