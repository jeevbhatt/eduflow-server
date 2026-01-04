import { BaseRepository } from "@core/repository/BaseRepository";
import { ForumCategory, ForumTopic, ForumPost } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class ForumRepo extends BaseRepository<ForumCategory> {
  constructor() {
    super("forumCategory");
  }

  // --- Category Methods ---
  async findCategoriesByInstitute(instituteId: string) {
    return this.model.findMany({
      where: { instituteId, deletedAt: null },
      include: {
        _count: {
          select: { topics: true },
        },
      },
      orderBy: { order: "asc" },
    });
  }

  // --- Topic Methods ---
  async findTopicsByCategory(categoryId: string, filters: any) {
    const { page = 1, limit = 20, filter } = filters;
    const skip = (page - 1) * limit;

    const where: any = { categoryId, deletedAt: null };
    if (filter === "resolved") where.isResolved = true;
    if (filter === "unresolved") where.isResolved = false;
    if (filter === "pinned") where.isPinned = true;

    return (prisma as any).forumTopic.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
        _count: { select: { posts: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    });
  }

  async findTopicById(topicId: string) {
    return (prisma as any).forumTopic.findUnique({
      where: { id: topicId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, profileImage: true },
        },
        category: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async createTopic(data: any) {
    return (prisma as any).forumTopic.create({ data });
  }

  async updateTopic(id: string, data: any) {
    return (prisma as any).forumTopic.update({ where: { id }, data });
  }

  async incrementTopicViews(id: string) {
    return (prisma as any).forumTopic.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  // --- Post Methods ---
  async findPostsByTopic(topicId: string, filters: any) {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    return (prisma as any).forumPost.findMany({
      where: { topicId, parentId: null, deletedAt: null },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, profileImage: true, role: true },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isAcceptedAnswer: "desc" }, { createdAt: "asc" }],
      skip,
      take: limit,
    });
  }

  async createPost(data: any) {
    return (prisma as any).forumPost.create({ data });
  }

  async updatePost(id: string, data: any) {
    return (prisma as any).forumPost.update({ where: { id }, data });
  }

  async setAcceptedAnswer(topicId: string, postId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.forumPost.updateMany({
        where: { topicId, isAcceptedAnswer: true },
        data: { isAcceptedAnswer: false },
      });
      await tx.forumPost.update({
        where: { id: postId },
        data: { isAcceptedAnswer: true },
      });
      await tx.forumTopic.update({
        where: { id: topicId },
        data: { isResolved: true },
      });
    });
  }
}

export default new ForumRepo();
