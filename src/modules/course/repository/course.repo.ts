import { BaseRepository } from "@core/repository/BaseRepository";
import { Course } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class CourseRepo extends BaseRepository<Course> {
  constructor() {
    super("course");
  }

  async findByInstitute(instituteId: string): Promise<Course[]> {
    return this.model.findMany({
      where: { instituteId },
      include: {
        category: true,
        _count: {
          select: {
            chapters: true,
            students: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findWithDetails(id: string): Promise<Course | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        category: true,
        chapters: {
          include: {
            lessons: true,
          },
          orderBy: { order: "asc" },
        },
        teachers: {
          include: {
            teacher: true,
          },
        },
      },
    });
  }
}

export default new CourseRepo();
