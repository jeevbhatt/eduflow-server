import { BaseRepository } from "@core/repository/BaseRepository";
import { StudyGroup, StudyGroupMember, StudySession, StudyGroupRole } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class StudyGroupRepo extends BaseRepository<StudyGroup> {
  constructor() {
    super("studyGroup");
  }

  // --- Group Methods ---
  async findByInstitute(instituteId: string, filters: any) {
    const { page = 1, limit = 20, courseId, isPublic } = filters;
    const skip = (page - 1) * limit;

    const where: any = { instituteId };
    if (courseId) where.courseId = courseId;
    if (typeof isPublic === "boolean") where.isPublic = isPublic;

    return this.model.findMany({
      where,
      include: {
        _count: { select: { members: true, sessions: true } },
        members: {
          include: { user: { select: { firstName: true, profileImage: true } } },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
  }

  async findUserGroups(userId: string) {
    return this.model.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, sessions: true } },
      },
    });
  }

  // --- Member Methods ---
  async joinGroup(groupId: string, userId: string, role: StudyGroupRole = StudyGroupRole.member) {
    return (prisma as any).studyGroupMember.create({
      data: { groupId, userId, role },
    });
  }

  async leaveGroup(groupId: string, userId: string) {
    return (prisma as any).studyGroupMember.deleteMany({
      where: { groupId, userId },
    });
  }

  async findMember(groupId: string, userId: string) {
    return (prisma as any).studyGroupMember.findFirst({
      where: { groupId, userId },
    });
  }

  async countMembers(groupId: string) {
    return (prisma as any).studyGroupMember.count({
      where: { groupId },
    });
  }

  // --- Session Methods ---
  async findSessionsByGroup(groupId: string, upcoming = true) {
    return (prisma as any).studySession.findMany({
      where: {
        groupId,
        ...(upcoming ? { scheduledAt: { gte: new Date() } } : {}),
      },
      orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
    });
  }

  async createSession(data: any) {
    return (prisma as any).studySession.create({ data });
  }
}

export default new StudyGroupRepo();
