import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import categoryService from "../services/category.service";

export const getAll = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.user?.currentInstituteNumber;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute ID not found" });
    }

    const categories = await categoryService.getAllCategories(instituteId);
    res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
