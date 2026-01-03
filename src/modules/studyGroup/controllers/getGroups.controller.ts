import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studyGroupService from "../services/studyGroup.service";

export const getGroups = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) throw new Error("Institute ID not found");

    const groups = await studyGroupService.getInstituteGroups(instituteId, req.query);
    res.json({ status: "success", data: groups });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
