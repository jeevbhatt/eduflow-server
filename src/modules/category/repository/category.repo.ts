import { BaseRepository } from "@core/repository/BaseRepository";
import { Category } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class CategoryRepo extends BaseRepository<Category> {
  constructor() {
    super("category");
  }

  async findByInstitute(instituteId: string): Promise<Category[]> {
    return this.model.findMany({
      where: { instituteId },
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: { categoryName: "asc" },
    });
  }

  async findByName(name: string, instituteId: string): Promise<Category | null> {
    return this.model.findUnique({
      where: {
        instituteId_categoryName: {
          instituteId,
          categoryName: name,
        },
      },
    });
  }
}

export default new CategoryRepo();
