import { BaseRepository } from "@core/repository/BaseRepository";
import { Student } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class StudentRepo extends BaseRepository<Student> {
  constructor() {
    super("student");
  }

  async findByUserId(userId: string): Promise<Student | null> {
    return this.model.findUnique({
      where: { userId },
    });
  }

  async findWithProfile(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        institute: true,
      },
    });
  }
}

export default new StudentRepo();
