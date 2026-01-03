import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const toggleTopicUpvote = async (req: IExtendedRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const { isUpvote } = req.body;
    const topic = await forumService.toggleTopicUpvote(topicId, isUpvote);
    res.json({ status: "success", data: topic });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
