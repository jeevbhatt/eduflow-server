import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import supportService from "../services/support.service";

export const getTicketDetails = async (req: IExtendedRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const isAdmin = req.user?.role === "institute" || req.user?.role === "super_admin";
    const ticket = await supportService.getTicketDetails(ticketId, isAdmin);
    if (!ticket) return res.status(404).json({ status: "error", message: "Ticket not found" });
    res.json({ status: "success", data: ticket });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
