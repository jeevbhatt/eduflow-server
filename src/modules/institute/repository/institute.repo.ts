import { BaseRepository } from "@core/repository/BaseRepository";
import { Institute } from "@prisma/client";

export class InstituteRepo extends BaseRepository<Institute> {
  constructor() {
    super("institute");
  }

  async findByOwner(userId: string) {
    return this.model.findMany({
      where: { ownerId: userId },
    });
  }

  async findByInstituteNumber(instituteNumber: number) {
    return this.model.findUnique({
      where: { instituteNumber },
    });
  }
}

export default new InstituteRepo();
