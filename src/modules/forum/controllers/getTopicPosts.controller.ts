import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const getTopicPosts = async (req: IExtendedRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const posts = await forumService.getTopicPosts(topicId, req.query);
    res.json({ status: "success", data: posts });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
