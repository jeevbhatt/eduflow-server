import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studyGroupService from "../services/studyGroup.service";

export const getGroupSessions = async (req: IExtendedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { upcoming = "true" } = req.query;
    const sessions = await studyGroupService.getGroupSessions(groupId, upcoming === "true");
    res.json({ status: "success", data: sessions });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
