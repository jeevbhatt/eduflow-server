import { BaseRepository } from "@core/repository/BaseRepository";
import { Teacher } from "@generated/prisma";
import prisma from "../../../core/database/prisma";

export class TeacherRepo extends BaseRepository<Teacher> {
  constructor() {
    super("teacher");
  }

  async findByEmail(email: string, instituteId: string): Promise<Teacher | null> {
    return this.model.findUnique({
      where: {
        instituteId_email: {
          instituteId,
          email,
        },
      },
      include: {
        user: true,
        institute: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Teacher | null> {
    return this.model.findFirst({
      where: { userId },
      include: {
        institute: true,
      },
    });
  }
}

export default new TeacherRepo();
