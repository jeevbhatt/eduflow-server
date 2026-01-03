import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import notificationService from "../services/notification.service";

export const markAsRead = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ids } = req.body;
    if (!userId) throw new Error("User ID not found");

    const result = await notificationService.markAsRead(userId, ids);
    res.json({ status: "success", data: result });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
