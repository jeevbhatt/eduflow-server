import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import forumService from "../services/forum.service";

export const getCategories = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const categories = await forumService.getCategories(instituteId);
    res.json({ status: "success", data: categories });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
