import { Request, Response } from "express";
import instituteRepo from "../repository/institute.repo";

export const getInstituteBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const institute = await instituteRepo.findBySubdomainPrefix(slug);

    if (!institute) {
      return res.status(404).json({
        status: "error",
        message: "Institute not found",
      });
    }

    res.json({
      status: "success",
      data: {
        id: institute.id,
        instituteName: institute.instituteName,
        subdomain: institute.subdomain,
        type: institute.type.toLowerCase(),
        logo: institute.logo,
        email: institute.email,
        phone: institute.phone,
        address: institute.address,
        completionPercentage: institute.profileCompletionPercent,
        createdAt: institute.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
