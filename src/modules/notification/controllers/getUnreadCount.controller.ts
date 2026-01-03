import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import notificationService from "../services/notification.service";

export const getUnreadCount = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const count = await notificationService.getUnreadCount(userId);
    res.json({ status: "success", data: { count } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
