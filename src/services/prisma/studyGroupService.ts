/**
 * Study Group Service
 * Matches Prisma schema: StudyGroup, StudyGroupMember, StudySession
 */

import prisma from "../../database/prisma";
import {
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  StudyGroup,
  StudyGroupMember,
  StudySession,
  StudyGroupRole,
} from "../../generated/prisma/client";

// DTO Types
interface CreateStudyGroupDTO {
  instituteId: string;
  courseId?: string;
  name: string;
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
}

interface UpdateStudyGroupDTO {
  name?: string;
  description?: string;
  maxMembers?: number;
  isPublic?: boolean;
}

interface CreateStudySessionDTO {
  groupId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // minutes
  meetingLink?: string;
}

interface StudyGroupWithDetails extends StudyGroup {
  members?: (StudyGroupMember & {
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
    };
  })[];
  sessions?: StudySession[];
  _count?: { members: number; sessions: number };
}

// ===========================================
// STUDY GROUP CRUD
// ===========================================

/**
 * Create a study group
 */
export async function createStudyGroup(
  ctx: RLSContext,
  data: CreateStudyGroupDTO
): Promise<StudyGroup> {
  return withRLSContext(ctx, async (tx) => {
    const group = await tx.studyGroup.create({
      data: {
        instituteId: data.instituteId,
        courseId: data.courseId,
        name: data.name,
        description: data.description,
        maxMembers: data.maxMembers || 10,
        isPublic: data.isPublic ?? true,
        createdBy: ctx.userId,
        // Creator is automatically an admin member
        members: {
          create: {
            userId: ctx.userId,
            role: StudyGroupRole.admin,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        _count: { select: { members: true, sessions: true } },
      },
    });

    return group;
  });
}

/**
 * Get study group by ID
 */
export async function getStudyGroup(
  ctx: RLSContext,
  groupId: string
): Promise<StudyGroupWithDetails | null> {
  return withRLSContext(ctx, async (tx) => {
    return tx.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        sessions: {
          where: { scheduledAt: { gte: new Date() } },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        },
        _count: { select: { members: true, sessions: true } },
      },
    });
  });
}

/**
 * Update study group
 */
export async function updateStudyGroup(
  ctx: RLSContext,
  groupId: string,
  data: UpdateStudyGroupDTO
): Promise<StudyGroup> {
  return withRLSContext(ctx, async (tx) => {
    // Verify user is admin
    const member = await tx.studyGroupMember.findFirst({
      where: {
        groupId,
        userId: ctx.userId,
        role: StudyGroupRole.admin,
      },
    });

    if (!member) {
      throw new Error("Not authorized to update this group");
    }

    return tx.studyGroup.update({
      where: { id: groupId },
      data,
      include: {
        _count: { select: { members: true, sessions: true } },
      },
    });
  });
}

/**
 * Delete study group
 */
export async function deleteStudyGroup(
  ctx: RLSContext,
  groupId: string
): Promise<StudyGroup> {
  return withRLSContext(ctx, async (tx) => {
    // Verify user is admin
    const member = await tx.studyGroupMember.findFirst({
      where: {
        groupId,
        userId: ctx.userId,
        role: StudyGroupRole.admin,
      },
    });

    if (!member) {
      throw new Error("Not authorized to delete this group");
    }

    return tx.studyGroup.delete({
      where: { id: groupId },
    });
  });
}

// ===========================================
// QUERIES
// ===========================================

/**
 * Get study groups for an institute
 */
export async function getInstituteStudyGroups(
  ctx: RLSContext,
  instituteId: string,
  options: PaginationOptions & { courseId?: string; isPublic?: boolean } = {}
): Promise<PaginatedResult<StudyGroupWithDetails>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = { instituteId };
    if (options.courseId) whereClause.courseId = options.courseId;
    if (typeof options.isPublic === "boolean")
      whereClause.isPublic = options.isPublic;

    const [groups, total] = await Promise.all([
      tx.studyGroup.findMany({
        where: whereClause,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
            take: 5,
          },
          _count: { select: { members: true, sessions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      tx.studyGroup.count({ where: whereClause }),
    ]);

    return {
      data: groups,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  });
}

/**
 * Get user's study groups
 */
export async function getUserStudyGroups(
  ctx: RLSContext,
  options: PaginationOptions = {}
): Promise<PaginatedResult<StudyGroupWithDetails>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause = {
      members: {
        some: {
          userId: ctx.userId,
        },
      },
    };

    const [groups, total] = await Promise.all([
      tx.studyGroup.findMany({
        where: whereClause,
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
          sessions: {
            where: { scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: "asc" },
            take: 3,
          },
          _count: { select: { members: true, sessions: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      tx.studyGroup.count({ where: whereClause }),
    ]);

    return {
      data: groups,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  });
}

/**
 * Search study groups
 */
export async function searchStudyGroups(
  ctx: RLSContext,
  query: string,
  instituteId: string
): Promise<StudyGroupWithDetails[]> {
  return withRLSContext(ctx, async (tx) => {
    return tx.studyGroup.findMany({
      where: {
        instituteId,
        isPublic: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        _count: { select: { members: true, sessions: true } },
      },
      take: 20,
    });
  });
}

// ===========================================
// MEMBERS
// ===========================================

/**
 * Join a study group
 */
export async function joinGroup(
  ctx: RLSContext,
  groupId: string
): Promise<StudyGroupMember> {
  return withRLSContext(ctx, async (tx) => {
    const group = await tx.studyGroup.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      throw new Error("Study group not found");
    }

    if (!group.isPublic) {
      throw new Error("This is a private group");
    }

    if (group._count.members >= group.maxMembers) {
      throw new Error("Study group is full");
    }

    // Check if already a member
    const existing = await tx.studyGroupMember.findFirst({
      where: { groupId, userId: ctx.userId },
    });

    if (existing) {
      throw new Error("Already a member of this group");
    }

    return tx.studyGroupMember.create({
      data: {
        groupId,
        userId: ctx.userId,
        role: StudyGroupRole.member,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });
  });
}

/**
 * Leave a study group
 */
export async function leaveGroup(
  ctx: RLSContext,
  groupId: string
): Promise<void> {
  return withRLSContext(ctx, async (tx) => {
    const member = await tx.studyGroupMember.findFirst({
      where: { groupId, userId: ctx.userId },
    });

    if (!member) {
      throw new Error("Not a member of this group");
    }

    // Check if user is the only admin
    if (member.role === StudyGroupRole.admin) {
      const adminCount = await tx.studyGroupMember.count({
        where: { groupId, role: StudyGroupRole.admin },
      });

      if (adminCount === 1) {
        throw new Error(
          "Cannot leave as the only admin. Transfer admin role first."
        );
      }
    }

    await tx.studyGroupMember.delete({
      where: { id: member.id },
    });
  });
}

/**
 * Add member to group (admin only)
 */
export async function addMember(
  ctx: RLSContext,
  groupId: string,
  userId: string
): Promise<StudyGroupMember> {
  return withRLSContext(ctx, async (tx) => {
    // Verify caller is admin
    const admin = await tx.studyGroupMember.findFirst({
      where: { groupId, userId: ctx.userId, role: StudyGroupRole.admin },
    });

    if (!admin) {
      throw new Error("Not authorized to add members");
    }

    return tx.studyGroupMember.create({
      data: {
        groupId,
        userId,
        role: StudyGroupRole.member,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });
  });
}

/**
 * Remove member from group (admin only)
 */
export async function removeMember(
  ctx: RLSContext,
  groupId: string,
  userId: string
): Promise<void> {
  return withRLSContext(ctx, async (tx) => {
    // Verify caller is admin
    const admin = await tx.studyGroupMember.findFirst({
      where: { groupId, userId: ctx.userId, role: StudyGroupRole.admin },
    });

    if (!admin) {
      throw new Error("Not authorized to remove members");
    }

    await tx.studyGroupMember.deleteMany({
      where: { groupId, userId },
    });
  });
}

/**
 * Update member role
 */
export async function updateMemberRole(
  ctx: RLSContext,
  groupId: string,
  userId: string,
  role: StudyGroupRole
): Promise<StudyGroupMember> {
  return withRLSContext(ctx, async (tx) => {
    // Verify caller is admin
    const admin = await tx.studyGroupMember.findFirst({
      where: { groupId, userId: ctx.userId, role: StudyGroupRole.admin },
    });

    if (!admin) {
      throw new Error("Not authorized to change roles");
    }

    const member = await tx.studyGroupMember.findFirst({
      where: { groupId, userId },
    });

    if (!member) {
      throw new Error("Member not found");
    }

    return tx.studyGroupMember.update({
      where: { id: member.id },
      data: { role },
    });
  });
}

// ===========================================
// STUDY SESSIONS
// ===========================================

/**
 * Create a study session
 */
export async function createSession(
  ctx: RLSContext,
  data: CreateStudySessionDTO
): Promise<StudySession> {
  return withRLSContext(ctx, async (tx) => {
    // Verify user is a member
    const member = await tx.studyGroupMember.findFirst({
      where: { groupId: data.groupId, userId: ctx.userId },
    });

    if (!member) {
      throw new Error("Not a member of this group");
    }

    return tx.studySession.create({
      data: {
        groupId: data.groupId,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        meetingLink: data.meetingLink,
        createdBy: ctx.userId,
      },
    });
  });
}

/**
 * Get group sessions
 */
export async function getGroupSessions(
  ctx: RLSContext,
  groupId: string,
  upcoming = true
): Promise<StudySession[]> {
  return withRLSContext(ctx, async (tx) => {
    return tx.studySession.findMany({
      where: {
        groupId,
        ...(upcoming ? { scheduledAt: { gte: new Date() } } : {}),
      },
      orderBy: { scheduledAt: upcoming ? "asc" : "desc" },
    });
  });
}

/**
 * Update study session
 */
export async function updateSession(
  ctx: RLSContext,
  sessionId: string,
  data: Partial<CreateStudySessionDTO>
): Promise<StudySession> {
  return withRLSContext(ctx, async (tx) => {
    const session = await tx.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Verify user is creator or admin
    if (session.createdBy !== ctx.userId) {
      const admin = await tx.studyGroupMember.findFirst({
        where: {
          groupId: session.groupId,
          userId: ctx.userId,
          role: StudyGroupRole.admin,
        },
      });

      if (!admin) {
        throw new Error("Not authorized to update this session");
      }
    }

    const { groupId, ...updateData } = data;
    return tx.studySession.update({
      where: { id: sessionId },
      data: updateData,
    });
  });
}

/**
 * Delete study session
 */
export async function deleteSession(
  ctx: RLSContext,
  sessionId: string
): Promise<StudySession> {
  return withRLSContext(ctx, async (tx) => {
    const session = await tx.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    // Verify user is creator or admin
    if (session.createdBy !== ctx.userId) {
      const admin = await tx.studyGroupMember.findFirst({
        where: {
          groupId: session.groupId,
          userId: ctx.userId,
          role: StudyGroupRole.admin,
        },
      });

      if (!admin) {
        throw new Error("Not authorized to delete this session");
      }
    }

    return tx.studySession.delete({
      where: { id: sessionId },
    });
  });
}

/**
 * Get user's upcoming sessions across all groups
 */
export async function getUserUpcomingSessions(
  ctx: RLSContext,
  limit = 10
): Promise<(StudySession & { group: StudyGroup })[]> {
  return withRLSContext(ctx, async (tx) => {
    // Get user's groups
    const memberships = await tx.studyGroupMember.findMany({
      where: { userId: ctx.userId },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    return tx.studySession.findMany({
      where: {
        groupId: { in: groupIds },
        scheduledAt: { gte: new Date() },
      },
      include: {
        group: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });
  });
}

// Export all functions as a service object
export const studyGroupService = {
  createStudyGroup,
  getStudyGroup,
  updateStudyGroup,
  deleteStudyGroup,
  getInstituteStudyGroups,
  getUserStudyGroups,
  searchStudyGroups,
  joinGroup,
  leaveGroup,
  addMember,
  removeMember,
  updateMemberRole,
  createSession,
  getGroupSessions,
  updateSession,
  deleteSession,
  getUserUpcomingSessions,
};
