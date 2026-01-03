import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const createPost = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { topicId } = req.params;
    if (!userId) throw new Error("User ID not found");

    const post = await forumService.createPost({
      ...req.body,
      topicId,
      authorId: userId,
    });
    res.status(201).json({ status: "success", data: post });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
