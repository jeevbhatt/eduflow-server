import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import categoryService from "../services/category.service";

export const create = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(403).json({ message: "Institute context required" });
    }

    const category = await categoryService.createCategory({
      ...req.body,
      instituteId,
    });

    res.status(201).json({
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
