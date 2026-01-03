import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import categoryService from "../services/category.service";

export const deleteCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
