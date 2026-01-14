import { BaseRepository } from "@core/repository/BaseRepository";
import prisma from "@core/database/prisma";
import { JoinRequestRole, JoinRequestStatus } from "../../../generated/prisma";

export class JoinRequestRepo {
  private model = prisma.instituteJoinRequest;

  async create(data: {
    userId: string;
    instituteId: string;
    role: string;
    message?: string;
  }) {
    return this.model.create({
      data: {
        userId: data.userId,
        instituteId: data.instituteId,
        role: data.role as JoinRequestRole,
        message: data.message,
      },
      include: {
        institute: {
          select: {
            id: true,
            instituteName: true,
            subdomain: true,
            logo: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      include: {
        institute: {
          select: {
            id: true,
            instituteName: true,
            subdomain: true,
            logo: true,
            address: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByInstituteId(instituteId: string, status?: string) {
    return this.model.findMany({
      where: {
        instituteId,
        ...(status && { status }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByUserAndInstitute(userId: string, instituteId: string) {
    return this.model.findUnique({
      where: {
        userId_instituteId: {
          userId,
          instituteId,
        },
      },
    });
  }

  async countPendingByUser(userId: string) {
    return this.model.count({
      where: {
        userId,
        status: "pending",
      },
    });
  }

  async updateStatus(
    id: string,
    status: "approved" | "rejected",
    reviewedBy: string
  ) {
    return this.model.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        user: true,
        institute: true,
      },
    });
  }

  async findById(id: string) {
    return this.model.findUnique({
      where: { id },
      include: {
        user: true,
        institute: true,
      },
    });
  }
}

export default new JoinRequestRepo();
