import { Request, Response } from "express";
import instituteRepo from "../repository/institute.repo";

/**
 * Search Institutes
 * GET /institutes/search?q=query
 *
 * Public endpoint to allow prospective students/teachers
 * to find institutes to join.
 */
export const searchInstitutes = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";

    // Efficiency: Don't search if query is too short (optional)
    if (query.length < 2) {
      return res.json({
        success: true,
        institutes: [],
      });
    }

    const institutes = await instituteRepo.search(query, 20);

    res.json({
      success: true,
      institutes,
    });
  } catch (error: any) {
    console.error("Search institutes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search institutes",
    });
  }
};
