import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studyGroupService from "../services/studyGroup.service";

export const createSession = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { groupId } = req.params;
    if (!userId) throw new Error("User ID not found");

    const session = await studyGroupService.createSession({
      ...req.body,
      groupId,
      userId,
    });
    res.status(201).json({ status: "success", data: session });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
