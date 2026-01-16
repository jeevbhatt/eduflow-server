import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import instituteService from "../services/institute.service";

export const createInstitute = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const institute = await instituteService.createInstitute(userId, req.body);

    res.status(201).json({
      status: "success",
      message: "Institute created successfully",
      data: institute
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
