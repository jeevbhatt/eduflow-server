import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import supportService from "../services/support.service";

export const addMessage = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;
    if (!userId) throw new Error("User ID not found");

    const message = await supportService.addMessage({
      ...req.body,
      ticketId,
      senderId: userId,
    });
    res.status(201).json({ status: "success", data: message });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
