import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const createTopic = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const topic = await forumService.createTopic({
      ...req.body,
      authorId: userId,
    });
    res.status(201).json({ status: "success", data: topic });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
