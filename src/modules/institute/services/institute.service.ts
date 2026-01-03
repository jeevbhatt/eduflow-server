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
}

export default new InstituteService();
