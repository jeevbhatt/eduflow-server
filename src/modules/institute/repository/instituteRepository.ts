import { BaseRepository } from "@core/repository/BaseRepository";
import { Institute } from "@prisma/client";

export class InstituteRepository extends BaseRepository<Institute> {
  constructor() {
    super("institute");
  }

  async findByInstituteNumber(instituteNumber: string): Promise<Institute | null> {
    return this.model.findUnique({
      where: { instituteNumber },
    });
  }

  async findWithStats(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
          },
        },
      },
    });
  }
}

export default new InstituteRepository();
