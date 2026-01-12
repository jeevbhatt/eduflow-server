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

  /**
   * Find institute by subdomain prefix (for duplicate checking)
   * Checks if any subdomain starts with the given prefix
   */
  async findBySubdomainPrefix(prefix: string): Promise<Institute | null> {
    return this.model.findFirst({
      where: {
        subdomain: {
          startsWith: prefix,
        },
      },
    });
  }

  /**
   * Find institute by exact subdomain
   */
  async findBySubdomain(subdomain: string): Promise<Institute | null> {
    return this.model.findUnique({
      where: { subdomain },
    });
  }
}

export default new InstituteRepo();
