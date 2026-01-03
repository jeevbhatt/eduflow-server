import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const getTopics = async (req: IExtendedRequest, res: Response) => {
  try {
    const { categoryId } = req.params;
    const topics = await forumService.getTopics(categoryId, req.query);
    res.json({ status: "success", data: topics });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
