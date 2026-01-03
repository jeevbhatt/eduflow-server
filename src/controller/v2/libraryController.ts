/**
 * Library Controller (v2 - Prisma)
 *
 * Handles HTTP requests for digital library resources
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/libraryController
 */

import { Response } from "express";
import { IExtendedRequest } from "../../middleware/type";
import {
  libraryCategoryService,
  libraryResourceService,
  libraryBorrowService,
  libraryFavoriteService,
  RLSContext,
} from "../../services/prisma";
import { LibraryResourceType } from "../../generated/prisma/client";

/**
 * Build RLS context from request
 */
const getRLSContext = (req: IExtendedRequest): RLSContext => ({
  userId: req.user?.id || "",
  userRole: req.user?.role || "student",
  instituteId: req.user?.currentInstituteId,
});

// ============================================
// CATEGORY ENDPOINTS
// ============================================

/**
 * Get library categories
 */
export const getCategories = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const categories = await libraryCategoryService.getCategoriesWithCounts(
      context,
      instituteId
    );

    res.status(200).json({
      message: "Categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

/**
 * Create a category
 */
export const createCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { name, description, icon, parentId } = req.body;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await libraryCategoryService.createCategory(context, {
      instituteId,
      name,
      description,
      icon,
      parentId,
    });

    res.status(201).json({
      message: "Category created successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error creating category:", error);
    res.status(500).json({
      message: "Error creating category",
      error: error.message,
    });
  }
};

/**
 * Update a category
 */
export const updateCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { categoryId } = req.params;
    const { name, description, icon } = req.body;

    const category = await libraryCategoryService.update(context, categoryId, {
      name,
      description,
      icon,
    });

    res.status(200).json({
      message: "Category updated successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error updating category:", error);
    res.status(500).json({
      message: "Error updating category",
      error: error.message,
    });
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { categoryId } = req.params;

    await libraryCategoryService.softDelete(context, categoryId);

    res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// ============================================
// RESOURCE ENDPOINTS
// ============================================

/**
 * Get library resources
 */
export const getResources = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { categoryId, type, search, page = "1", limit = "20" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const resources = await libraryResourceService.searchResources(context, {
      instituteId,
      categoryId: categoryId as string | undefined,
      type: type as LibraryResourceType | undefined,
      search: search as string | undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Resources fetched successfully",
      ...resources,
    });
  } catch (error: any) {
    console.error("Error fetching resources:", error);
    res.status(500).json({
      message: "Error fetching resources",
      error: error.message,
    });
  }
};

/**
 * Get popular resources
 */
export const getPopularResources = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { limit = "10" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const resources = await libraryResourceService.getPopularResources(
      context,
      instituteId,
      parseInt(limit as string)
    );

    res.status(200).json({
      message: "Popular resources fetched successfully",
      data: resources,
    });
  } catch (error: any) {
    console.error("Error fetching popular resources:", error);
    res.status(500).json({
      message: "Error fetching popular resources",
      error: error.message,
    });
  }
};

/**
 * Get single resource
 */
export const getResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { resourceId } = req.params;

    // Increment view count
    await libraryResourceService.incrementViews(context, resourceId);

    const resource = await libraryResourceService.findById(
      context,
      resourceId,
      {
        category: { select: { id: true, name: true } },
        uploadedByUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      }
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Check if favorited
    let isFavorite = false;
    if (userId) {
      isFavorite = await libraryFavoriteService.isFavorite(
        context,
        userId,
        resourceId
      );
    }

    res.status(200).json({
      message: "Resource fetched successfully",
      data: { ...resource, isFavorite },
    });
  } catch (error: any) {
    console.error("Error fetching resource:", error);
    res.status(500).json({
      message: "Error fetching resource",
      error: error.message,
    });
  }
};

/**
 * Create a resource
 */
export const createResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const instituteId = req.user?.currentInstituteId;
    const {
      categoryId,
      title,
      type,
      fileUrl,
      thumbnailUrl,
      externalUrl,
      description,
      author,
      publisher,
      isbn,
      publishedAt,
      totalCopies,
      tags,
      isPublic,
      isDownloadable,
    } = req.body;

    if (!userId || !instituteId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!categoryId || !title || !type) {
      return res.status(400).json({
        message: "Category ID, title, and type are required",
      });
    }

    const resource = await libraryResourceService.createResource(context, {
      instituteId,
      categoryId,
      title,
      type: type as LibraryResourceType,
      fileUrl,
      thumbnailUrl,
      externalUrl,
      description,
      author,
      publisher,
      isbn,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      totalCopies,
      tags,
      uploadedBy: userId,
      isPublic,
      isDownloadable,
    });

    res.status(201).json({
      message: "Resource created successfully",
      data: resource,
    });
  } catch (error: any) {
    console.error("Error creating resource:", error);
    res.status(500).json({
      message: "Error creating resource",
      error: error.message,
    });
  }
};

/**
 * Update a resource
 */
export const updateResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { resourceId } = req.params;
    const {
      title,
      description,
      author,
      publisher,
      isbn,
      publishedAt,
      totalCopies,
      tags,
      thumbnailUrl,
      isPublic,
      isDownloadable,
    } = req.body;

    const resource = await libraryResourceService.update(context, resourceId, {
      title,
      description,
      author,
      publisher,
      isbn,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      totalCopies,
      tags,
      thumbnailUrl,
      isPublic,
      isDownloadable,
    });

    res.status(200).json({
      message: "Resource updated successfully",
      data: resource,
    });
  } catch (error: any) {
    console.error("Error updating resource:", error);
    res.status(500).json({
      message: "Error updating resource",
      error: error.message,
    });
  }
};

/**
 * Delete a resource
 */
export const deleteResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { resourceId } = req.params;

    await libraryResourceService.softDelete(context, resourceId);

    res.status(200).json({
      message: "Resource deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    res.status(500).json({
      message: "Error deleting resource",
      error: error.message,
    });
  }
};

/**
 * Record download
 */
export const recordDownload = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { resourceId } = req.params;

    await libraryResourceService.incrementDownloads(context, resourceId);

    res.status(200).json({
      message: "Download recorded",
    });
  } catch (error: any) {
    console.error("Error recording download:", error);
    res.status(500).json({
      message: "Error recording download",
      error: error.message,
    });
  }
};

// ============================================
// BORROW ENDPOINTS
// ============================================

/**
 * Get my borrowed resources
 */
export const getMyBorrows = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { status, page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const borrows = await libraryBorrowService.getStudentBorrows(
      context,
      userId,
      {
        includeReturned: status === "all",
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(200).json({
      message: "Borrows fetched successfully",
      ...borrows,
    });
  } catch (error: any) {
    console.error("Error fetching borrows:", error);
    res.status(500).json({
      message: "Error fetching borrows",
      error: error.message,
    });
  }
};

/**
 * Borrow a resource
 */
export const borrowResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { resourceId, dueDate } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!resourceId || !dueDate) {
      return res.status(400).json({
        message: "Resource ID and due date are required",
      });
    }

    const borrow = await libraryBorrowService.borrowResource(context, {
      studentId: userId,
      resourceId,
      dueDate: new Date(dueDate),
    });

    res.status(201).json({
      message: "Resource borrowed successfully",
      data: borrow,
    });
  } catch (error: any) {
    console.error("Error borrowing resource:", error);
    res.status(400).json({
      message: error.message || "Error borrowing resource",
    });
  }
};

/**
 * Return a resource
 */
export const returnResource = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { borrowId } = req.params;

    const borrow = await libraryBorrowService.returnResource(context, borrowId);

    res.status(200).json({
      message: "Resource returned successfully",
      data: borrow,
    });
  } catch (error: any) {
    console.error("Error returning resource:", error);
    res.status(400).json({
      message: error.message || "Error returning resource",
    });
  }
};

/**
 * Extend due date
 */
export const extendDueDate = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { borrowId } = req.params;
    const { newDueDate } = req.body;

    if (!newDueDate) {
      return res.status(400).json({ message: "New due date is required" });
    }

    const borrow = await libraryBorrowService.extendDueDate(
      context,
      borrowId,
      new Date(newDueDate)
    );

    res.status(200).json({
      message: "Due date extended successfully",
      data: borrow,
    });
  } catch (error: any) {
    console.error("Error extending due date:", error);
    res.status(500).json({
      message: "Error extending due date",
      error: error.message,
    });
  }
};

/**
 * Get overdue borrows (admin)
 */
export const getOverdueBorrows = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { page = "1", limit = "20" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const borrows = await libraryBorrowService.getOverdueBorrows(
      context,
      instituteId
    );

    res.status(200).json({
      message: "Overdue borrows fetched successfully",
      ...borrows,
    });
  } catch (error: any) {
    console.error("Error fetching overdue borrows:", error);
    res.status(500).json({
      message: "Error fetching overdue borrows",
      error: error.message,
    });
  }
};

// ============================================
// FAVORITE ENDPOINTS
// ============================================

/**
 * Get my favorites
 */
export const getMyFavorites = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const favorites = await libraryFavoriteService.getUserFavorites(
      context,
      userId,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(200).json({
      message: "Favorites fetched successfully",
      ...favorites,
    });
  } catch (error: any) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      message: "Error fetching favorites",
      error: error.message,
    });
  }
};

/**
 * Toggle favorite
 */
export const toggleFavorite = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { resourceId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const result = await libraryFavoriteService.toggleFavorite(
      context,
      userId,
      resourceId
    );

    res.status(200).json({
      message: result.isFavorite
        ? "Added to favorites"
        : "Removed from favorites",
      data: result,
    });
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({
      message: "Error toggling favorite",
      error: error.message,
    });
  }
};
