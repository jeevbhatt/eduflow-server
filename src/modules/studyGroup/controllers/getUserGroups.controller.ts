import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studyGroupService from "../services/studyGroup.service";

export const getUserGroups = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const groups = await studyGroupService.getUserGroups(userId);
    res.json({ status: "success", data: groups });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
