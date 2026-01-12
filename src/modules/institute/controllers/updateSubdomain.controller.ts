import { Request, Response } from "express";
import instituteService from "../services/institute.service";

/**
 * Update institute subdomain
 * POST /institute/:id/subdomain
 */
export const updateSubdomain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subdomain } = req.body;
    const userId = (req as any).user.id;

    if (!subdomain) {
      return res.status(400).json({
        status: "error",
        message: "New subdomain is required",
      });
    }

    const updatedInstitute = await instituteService.updateSubdomain(userId, id, subdomain);

    res.status(200).json({
      status: "success",
      message: "Subdomain updated successfully",
      data: updatedInstitute,
    });
  } catch (error: any) {
    res.status(400).json({
      status: "error",
      message: error.message || "Failed to update subdomain",
    });
  }
};
