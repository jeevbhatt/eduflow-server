import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const getCategories = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const categories = await forumService.getCategories(instituteId);
    res.json({ status: "success", data: categories });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
