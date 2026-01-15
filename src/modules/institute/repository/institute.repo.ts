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
   * Search institutes by name or subdomain (case-insensitive)
   */
  async search(query: string, limit: number = 20) {
    return this.model.findMany({
      where: {
        OR: [
          { instituteName: { contains: query, mode: "insensitive" } },
          { subdomain: { contains: query, mode: "insensitive" } },
        ],
        // Only return institutes that are active/trial
        accountStatus: { in: ["active", "trial"] },
      },
      take: limit,
      select: {
        id: true,
        instituteName: true,
        subdomain: true,
        logo: true,
        address: true,
        type: true,
      }
    });
  }
}

export default new InstituteRepo();
