import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const markAcceptedAnswer = async (req: IExtendedRequest, res: Response) => {
  try {
    const { topicId, postId } = req.params;
    await forumService.markAcceptedAnswer(topicId, postId);
    res.json({ status: "success", message: "Answer marked as accepted" });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
