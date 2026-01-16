import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studyGroupService from "../services/studyGroup.service";

export const createGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.instituteId;
    if (!userId || !instituteId) throw new Error("Missing user or institute context");

    const group = await studyGroupService.createGroup({
      ...req.body,
      userId,
      instituteId,
    });
    res.status(201).json({ status: "success", data: group });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
