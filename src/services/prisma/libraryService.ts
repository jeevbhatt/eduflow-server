/**
 * Library Service
 *
 * Handles digital library resources, borrowing, and favorites
 * Simplified to match actual Prisma schema
 *
 * @module services/prisma/libraryService
 */

import prisma from "../../database/prisma";
import {
  BasePrismaService,
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  LibraryCategory,
  LibraryResource,
  LibraryBorrow,
  LibraryFavorite,
  LibraryResourceType,
  LibraryBorrowStatus,
  Prisma,
} from "../../generated/prisma/client";

// ============================================
// LIBRARY CATEGORY SERVICE
// ============================================

class LibraryCategoryService extends BasePrismaService<
  LibraryCategory,
  Prisma.LibraryCategoryCreateInput,
  Prisma.LibraryCategoryUpdateInput,
  Prisma.LibraryCategoryWhereInput,
  Prisma.LibraryCategoryOrderByWithRelationInput
> {
  protected modelName = "LibraryCategory";

  protected getDelegate() {
    return prisma.libraryCategory;
  }

  /**
   * Get categories with resource counts
   */
  async getCategoriesWithCounts(
    context: RLSContext,
    instituteId: string
  ): Promise<Array<LibraryCategory & { resourceCount: number }>> {
    return withRLSContext(context, async () => {
      const categories = await prisma.libraryCategory.findMany({
        where: {
          instituteId,
        },
        include: {
          _count: {
            select: { resources: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return categories.map((c) => ({
        ...c,
        resourceCount: c._count.resources,
      }));
    });
  }

  /**
   * Create a category
   */
  async createCategory(
    context: RLSContext,
    data: {
      instituteId: string;
      name: string;
      description?: string;
      icon?: string;
      parentId?: string;
    }
  ): Promise<LibraryCategory> {
    return withRLSContext(context, async (tx) => {
      return tx.libraryCategory.create({
        data: {
          instituteId: data.instituteId,
          name: data.name,
          description: data.description,
          icon: data.icon,
          parentId: data.parentId,
        },
      });
    });
  }
}

// ============================================
// LIBRARY RESOURCE SERVICE
// ============================================

class LibraryResourceService extends BasePrismaService<
  LibraryResource,
  Prisma.LibraryResourceCreateInput,
  Prisma.LibraryResourceUpdateInput,
  Prisma.LibraryResourceWhereInput,
  Prisma.LibraryResourceOrderByWithRelationInput
> {
  protected modelName = "LibraryResource";

  protected getDelegate() {
    return prisma.libraryResource;
  }

  /**
   * Search resources with filters
   */
  async searchResources(
    context: RLSContext,
    options: PaginationOptions & {
      instituteId: string;
      categoryId?: string;
      type?: LibraryResourceType;
      search?: string;
      tags?: string[];
    }
  ): Promise<PaginatedResult<LibraryResource>> {
    const where: Prisma.LibraryResourceWhereInput = {
      instituteId: options.instituteId,
      deletedAt: null,
    };

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.type) {
      where.type = options.type;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { author: { contains: options.search, mode: "insensitive" } },
      ];
    }

    if (options.tags && options.tags.length > 0) {
      where.tags = { hasSome: options.tags };
    }

    return this.findMany(context, {
      ...options,
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Get popular resources
   */
  async getPopularResources(
    context: RLSContext,
    instituteId: string,
    limit: number = 10
  ): Promise<LibraryResource[]> {
    return withRLSContext(context, async (tx) => {
      return tx.libraryResource.findMany({
        where: {
          instituteId,
          deletedAt: null,
          isPublic: true,
        },
        orderBy: [{ downloadCount: "desc" }, { viewCount: "desc" }],
        take: limit,
      });
    });
  }

  /**
   * Create a resource
   */
  async createResource(
    context: RLSContext,
    data: {
      instituteId: string;
      categoryId: string;
      title: string;
      type: LibraryResourceType;
      fileUrl?: string;
      thumbnailUrl?: string;
      externalUrl?: string;
      description?: string;
      author?: string;
      publisher?: string;
      isbn?: string;
      publishedAt?: Date;
      totalCopies?: number;
      tags?: string[];
      uploadedBy: string;
      isPublic?: boolean;
      isDownloadable?: boolean;
    }
  ): Promise<LibraryResource> {
    return withRLSContext(context, async (tx) => {
      return tx.libraryResource.create({
        data: {
          instituteId: data.instituteId,
          categoryId: data.categoryId,
          title: data.title,
          type: data.type,
          fileUrl: data.fileUrl,
          thumbnailUrl: data.thumbnailUrl,
          externalUrl: data.externalUrl,
          description: data.description,
          author: data.author,
          publisher: data.publisher,
          isbn: data.isbn,
          publishedAt: data.publishedAt,
          totalCopies: data.totalCopies ?? 1,
          availableCopies: data.totalCopies ?? 1,
          tags: data.tags ?? [],
          uploadedBy: data.uploadedBy,
          isPublic: data.isPublic ?? false,
          isDownloadable: data.isDownloadable ?? true,
        },
      });
    });
  }

  /**
   * Increment view count
   */
  async incrementViews(
    context: RLSContext,
    resourceId: string
  ): Promise<LibraryResource> {
    return withRLSContext(context, async (tx) => {
      return tx.libraryResource.update({
        where: { id: resourceId },
        data: { viewCount: { increment: 1 } },
      });
    });
  }

  /**
   * Increment download count
   */
  async incrementDownloads(
    context: RLSContext,
    resourceId: string
  ): Promise<LibraryResource> {
    return withRLSContext(context, async (tx) => {
      return tx.libraryResource.update({
        where: { id: resourceId },
        data: { downloadCount: { increment: 1 } },
      });
    });
  }
}

// ============================================
// LIBRARY BORROW SERVICE
// ============================================

class LibraryBorrowService extends BasePrismaService<
  LibraryBorrow,
  Prisma.LibraryBorrowCreateInput,
  Prisma.LibraryBorrowUpdateInput,
  Prisma.LibraryBorrowWhereInput,
  Prisma.LibraryBorrowOrderByWithRelationInput
> {
  protected modelName = "LibraryBorrow";

  protected getDelegate() {
    return prisma.libraryBorrow;
  }

  /**
   * Borrow a resource (for students)
   */
  async borrowResource(
    context: RLSContext,
    data: {
      resourceId: string;
      studentId: string;
      dueDate: Date;
    }
  ): Promise<LibraryBorrow> {
    return withRLSContext(context, async (tx) => {
      // Check availability
      const resource = await tx.libraryResource.findUnique({
        where: { id: data.resourceId },
      });

      if (!resource) {
        throw new Error("Resource not found");
      }

      if (resource.availableCopies < 1) {
        throw new Error("No copies available");
      }

      // Create borrow record
      const borrow = await tx.libraryBorrow.create({
        data: {
          resourceId: data.resourceId,
          studentId: data.studentId,
          dueDate: data.dueDate,
          status: LibraryBorrowStatus.borrowed,
        },
      });

      // Decrement available copies
      await tx.libraryResource.update({
        where: { id: data.resourceId },
        data: { availableCopies: { decrement: 1 } },
      });

      return borrow;
    });
  }

  /**
   * Return a borrowed resource
   */
  async returnResource(
    context: RLSContext,
    borrowId: string
  ): Promise<LibraryBorrow> {
    return withRLSContext(context, async (tx) => {
      const borrow = await tx.libraryBorrow.findUnique({
        where: { id: borrowId },
      });

      if (!borrow) {
        throw new Error("Borrow record not found");
      }

      if (borrow.status === LibraryBorrowStatus.returned) {
        throw new Error("Already returned");
      }

      // Update borrow status
      const updated = await tx.libraryBorrow.update({
        where: { id: borrowId },
        data: {
          status: LibraryBorrowStatus.returned,
          returnedAt: new Date(),
        },
      });

      // Increment available copies
      await tx.libraryResource.update({
        where: { id: borrow.resourceId },
        data: { availableCopies: { increment: 1 } },
      });

      return updated;
    });
  }

  /**
   * Get student's borrows
   */
  async getStudentBorrows(
    context: RLSContext,
    studentId: string,
    options?: PaginationOptions & { includeReturned?: boolean }
  ): Promise<PaginatedResult<LibraryBorrow>> {
    const where: Prisma.LibraryBorrowWhereInput = {
      studentId,
      ...(options?.includeReturned
        ? {}
        : { status: { not: LibraryBorrowStatus.returned } }),
    };

    return this.findMany(context, {
      ...options,
      where,
      include: {
        resource: {
          select: { id: true, title: true, type: true, thumbnailUrl: true },
        },
      },
      orderBy: { borrowedAt: "desc" },
    });
  }

  /**
   * Get overdue borrows for an institute
   */
  async getOverdueBorrows(
    context: RLSContext,
    instituteId: string
  ): Promise<LibraryBorrow[]> {
    return withRLSContext(context, async (tx) => {
      return tx.libraryBorrow.findMany({
        where: {
          status: LibraryBorrowStatus.borrowed,
          dueDate: { lt: new Date() },
          resource: { instituteId },
        },
        include: {
          resource: true,
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { dueDate: "asc" },
      });
    });
  }

  /**
   * Extend due date
   */
  async extendDueDate(
    context: RLSContext,
    borrowId: string,
    newDueDate: Date
  ): Promise<LibraryBorrow> {
    return this.update(context, borrowId, {
      dueDate: newDueDate,
      renewCount: { increment: 1 },
    });
  }
}

// ============================================
// LIBRARY FAVORITE SERVICE
// ============================================

class LibraryFavoriteService extends BasePrismaService<
  LibraryFavorite,
  Prisma.LibraryFavoriteCreateInput,
  Prisma.LibraryFavoriteUpdateInput,
  Prisma.LibraryFavoriteWhereInput,
  Prisma.LibraryFavoriteOrderByWithRelationInput
> {
  protected modelName = "LibraryFavorite";

  protected getDelegate() {
    return prisma.libraryFavorite;
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(
    context: RLSContext,
    userId: string,
    resourceId: string
  ): Promise<{ isFavorite: boolean }> {
    return withRLSContext(context, async (tx) => {
      const existing = await tx.libraryFavorite.findUnique({
        where: {
          resourceId_userId: { resourceId, userId },
        },
      });

      if (existing) {
        await tx.libraryFavorite.delete({
          where: { id: existing.id },
        });
        return { isFavorite: false };
      }

      await tx.libraryFavorite.create({
        data: { userId, resourceId },
      });
      return { isFavorite: true };
    });
  }

  /**
   * Get user's favorites
   */
  async getUserFavorites(
    context: RLSContext,
    userId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<LibraryFavorite>> {
    return this.findMany(context, {
      ...options,
      where: { userId },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
            thumbnailUrl: true,
            author: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Check if resource is favorited
   */
  async isFavorite(
    context: RLSContext,
    userId: string,
    resourceId: string
  ): Promise<boolean> {
    return withRLSContext(context, async (tx) => {
      const fav = await tx.libraryFavorite.findUnique({
        where: {
          resourceId_userId: { resourceId, userId },
        },
      });
      return !!fav;
    });
  }
}

// Export singleton instances
export const libraryCategoryService = new LibraryCategoryService();
export const libraryResourceService = new LibraryResourceService();
export const libraryBorrowService = new LibraryBorrowService();
export const libraryFavoriteService = new LibraryFavoriteService();

// Export classes for testing
export {
  LibraryCategoryService,
  LibraryResourceService,
  LibraryBorrowService,
  LibraryFavoriteService,
};
