/**
 * Forum Service
 *
 * Handles discussion forums, topics, and posts
 * Supports categories, upvotes, pinning, and accepted answers
 *
 * @module services/prisma/forumService
 */

import prisma from "../../database/prisma";
import {
  BasePrismaService,
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  ForumCategory,
  ForumTopic,
  ForumPost,
  Prisma,
} from "../../generated/prisma/client";

// ============================================
// FORUM CATEGORY SERVICE
// ============================================

class ForumCategoryService extends BasePrismaService<
  ForumCategory,
  Prisma.ForumCategoryCreateInput,
  Prisma.ForumCategoryUpdateInput,
  Prisma.ForumCategoryWhereInput,
  Prisma.ForumCategoryOrderByWithRelationInput
> {
  protected modelName = "ForumCategory";

  protected getDelegate() {
    return prisma.forumCategory;
  }

  /**
   * Get all categories for an institute with topic counts
   */
  async getCategoriesWithCounts(
    context: RLSContext,
    instituteId: string
  ): Promise<any[]> {
    return withRLSContext(context, async () => {
      return prisma.forumCategory.findMany({
        where: {
          instituteId,
        },
        include: {
          _count: {
            select: { topics: true },
          },
        },
        orderBy: { order: "asc" },
      });
    });
  }

  /**
   * Create a forum category
   */
  async createCategory(
    context: RLSContext,
    data: {
      instituteId: string;
      name: string;
      description?: string;
      icon?: string;
      color?: string;
    }
  ): Promise<ForumCategory> {
    return this.create(context, {
      institute: { connect: { id: data.instituteId } },
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
    });
  }
}

// ============================================
// FORUM TOPIC SERVICE
// ============================================

class ForumTopicService extends BasePrismaService<
  ForumTopic,
  Prisma.ForumTopicCreateInput,
  Prisma.ForumTopicUpdateInput,
  Prisma.ForumTopicWhereInput,
  Prisma.ForumTopicOrderByWithRelationInput
> {
  protected modelName = "ForumTopic";

  protected getDelegate() {
    return prisma.forumTopic;
  }

  /**
   * Get topics for a category
   */
  async getCategoryTopics(
    context: RLSContext,
    categoryId: string,
    options: PaginationOptions & {
      filter?: "all" | "resolved" | "unresolved" | "pinned";
    }
  ): Promise<PaginatedResult<ForumTopic>> {
    const where: Prisma.ForumTopicWhereInput = {
      categoryId,
      deletedAt: null,
    };

    if (options.filter === "resolved") {
      where.isResolved = true;
    } else if (options.filter === "unresolved") {
      where.isResolved = false;
    } else if (options.filter === "pinned") {
      where.isPinned = true;
    }

    return this.findMany(context, {
      ...options,
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    } as any);
  }

  /**
   * Get trending topics across institute
   */
  async getTrendingTopics(
    context: RLSContext,
    instituteId: string,
    limit: number = 10
  ): Promise<ForumTopic[]> {
    return withRLSContext(context, async () => {
      return prisma.forumTopic.findMany({
        where: {
          category: { instituteId },
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: [{ upvotes: "desc" }, { viewCount: "desc" }],
        take: limit,
      });
    });
  }

  /**
   * Create a topic
   */
  async createTopic(
    context: RLSContext,
    data: {
      categoryId: string;
      authorId: string;
      title: string;
      content: string;
      tags?: string[];
    }
  ): Promise<ForumTopic> {
    return this.create(context, {
      category: { connect: { id: data.categoryId } },
      author: { connect: { id: data.authorId } },
      title: data.title,
      content: data.content,
      tags: data.tags || [],
    });
  }

  /**
   * Increment view count
   */
  async incrementViews(
    context: RLSContext,
    topicId: string
  ): Promise<ForumTopic> {
    return withRLSContext(context, async () => {
      return prisma.forumTopic.update({
        where: { id: topicId },
        data: { viewCount: { increment: 1 } },
      });
    });
  }

  /**
   * Toggle upvote
   */
  async toggleUpvote(
    context: RLSContext,
    topicId: string,
    userId: string,
    isUpvote: boolean
  ): Promise<ForumTopic> {
    return withRLSContext(context, async () => {
      return prisma.forumTopic.update({
        where: { id: topicId },
        data: {
          upvotes: isUpvote ? { increment: 1 } : { decrement: 1 },
        },
      });
    });
  }

  /**
   * Mark as resolved
   */
  async markResolved(
    context: RLSContext,
    topicId: string,
    isResolved: boolean
  ): Promise<ForumTopic> {
    return this.update(context, topicId, { isResolved });
  }

  /**
   * Toggle pin status
   */
  async togglePin(
    context: RLSContext,
    topicId: string,
    isPinned: boolean
  ): Promise<ForumTopic> {
    return this.update(context, topicId, { isPinned });
  }

  /**
   * Search topics
   */
  async searchTopics(
    context: RLSContext,
    instituteId: string,
    query: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ForumTopic>> {
    return this.findMany(context, {
      ...options,
      where: {
        category: { instituteId },
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    } as any);
  }
}

// ============================================
// FORUM POST SERVICE
// ============================================

class ForumPostService extends BasePrismaService<
  ForumPost,
  Prisma.ForumPostCreateInput,
  Prisma.ForumPostUpdateInput,
  Prisma.ForumPostWhereInput,
  Prisma.ForumPostOrderByWithRelationInput
> {
  protected modelName = "ForumPost";

  protected getDelegate() {
    return prisma.forumPost;
  }

  /**
   * Get posts for a topic
   */
  async getTopicPosts(
    context: RLSContext,
    topicId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ForumPost>> {
    return this.findMany(context, {
      ...options,
      where: {
        topicId,
        parentId: null, // Only root posts, not replies
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isAcceptedAnswer: "desc" }, { createdAt: "asc" }],
    } as any);
  }

  /**
   * Create a post/reply
   */
  async createPost(
    context: RLSContext,
    data: {
      topicId: string;
      authorId: string;
      content: string;
      parentId?: string;
    }
  ): Promise<ForumPost> {
    return this.create(context, {
      topic: { connect: { id: data.topicId } },
      author: { connect: { id: data.authorId } },
      content: data.content,
      parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
    });
  }

  /**
   * Mark as accepted answer
   */
  async markAsAcceptedAnswer(
    context: RLSContext,
    postId: string,
    topicId: string
  ): Promise<ForumPost> {
    return withRLSContext(context, async () => {
      // First, unmark any existing accepted answer
      await prisma.forumPost.updateMany({
        where: { topicId, isAcceptedAnswer: true },
        data: { isAcceptedAnswer: false },
      });

      // Mark the new accepted answer
      const post = await prisma.forumPost.update({
        where: { id: postId },
        data: { isAcceptedAnswer: true },
      });

      // Mark topic as resolved
      await prisma.forumTopic.update({
        where: { id: topicId },
        data: { isResolved: true },
      });

      return post;
    });
  }

  /**
   * Toggle upvote on post
   */
  async toggleUpvote(
    context: RLSContext,
    postId: string,
    isUpvote: boolean
  ): Promise<ForumPost> {
    return withRLSContext(context, async () => {
      return prisma.forumPost.update({
        where: { id: postId },
        data: {
          upvotes: isUpvote ? { increment: 1 } : { decrement: 1 },
        },
      });
    });
  }
}

// Export singleton instances
export const forumCategoryService = new ForumCategoryService();
export const forumTopicService = new ForumTopicService();
export const forumPostService = new ForumPostService();
