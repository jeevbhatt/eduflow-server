import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studyGroupService from "../services/studyGroup.service";

export const joinGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    if (!userId) throw new Error("User ID not found");

    const member = await studyGroupService.joinGroup(groupId, userId);
    res.json({ status: "success", data: member });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
