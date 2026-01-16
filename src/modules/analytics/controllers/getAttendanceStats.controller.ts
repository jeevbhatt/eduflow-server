import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import analyticsService from "../services/analytics.service";

export const getAttendanceStats = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute context required" });
    }

    const stats = await analyticsService.getAttendanceStats(instituteId);
    res.status(200).json({
      message: "Attendance stats fetched successfully",
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
