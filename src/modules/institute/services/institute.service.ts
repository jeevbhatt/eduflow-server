import instituteRepo from "../repository/institute.repo";
import prisma from "../../../core/database/prisma";

export class InstituteService {
  async createInstitute(userId: string, data: any) {
    const { instituteName, email, phone, address, panNo, vatNo } = data;

    return prisma.$transaction(async (tx: any) => {
      const newInstitute = await tx.institute.create({
        data: {
          instituteName,
          email,
          phone,
          address,
          panNo,
          vatNo,
          owner: { connect: { id: userId } },
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          currentInstituteNumber: newInstitute.instituteNumber,
          role: "institute",
        },
      });

      return newInstitute;
    });
  }

  async getMyInstitutes(userId: string) {
    return instituteRepo.findByOwner(userId);
  }

  async getInstituteDetails(instituteNumber: number) {
    return instituteRepo.findByInstituteNumber(instituteNumber);
  }

  /**
   * Update institute subdomain
   * Restricted to paid users only
   */
  async updateSubdomain(userId: string, instituteId: string, newSubdomain: string) {
    // 1. Get institute and check ownership
    const institute = await instituteRepo.findById(instituteId);

    if (!institute) {
      throw new Error("Institute not found");
    }

    if (institute.ownerId !== userId) {
      throw new Error("You do not have permission to modify this institute");
    }

    // 2. Enforce "Paid User Only" rule
    if (institute.subscriptionTier === "trial") {
      throw new Error("Custom subdomains are only available for paid subscribers. Please upgrade your plan to change your subdomain.");
    }

    // 3. Clean and validate new subdomain
    const cleanSubdomain = newSubdomain.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

    if (cleanSubdomain.length < 3) {
      throw new Error("Subdomain must be at least 3 characters long");
    }

    // 4. Check if subdomain is already taken
    const existing = await instituteRepo.findBySubdomain(cleanSubdomain);
    if (existing && existing.id !== instituteId) {
      throw new Error("This subdomain is already taken. Please choose another one.");
    }

    // 5. Update
    return instituteRepo.update(instituteId, {
      subdomain: cleanSubdomain
    });
  }
}

export default new InstituteService();
