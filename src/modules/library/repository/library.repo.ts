import { BaseRepository } from "@core/repository/BaseRepository";
import { LibraryResource, LibraryBorrow } from "@generated/prisma";
import prisma from "../../../core/database/prisma";

export class LibraryRepo extends BaseRepository<LibraryResource> {
  constructor() {
    super("libraryResource");
  }

  async findByInstitute(instituteId: string, filters: any) {
    const { search, categoryId, status, type } = filters;

    const where: any = {
      instituteId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "All Categories") {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    return this.model.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBorrowHistory(studentId: string, instituteId: string) {
    return (prisma as any).libraryBorrow.findMany({
      where: {
        studentId,
        resource: { instituteId },
      },
      include: {
        resource: {
          select: { title: true, author: true, isbn: true },
        },
      },
      orderBy: { borrowedAt: "desc" },
    });
  }
}

export default new LibraryRepo();
