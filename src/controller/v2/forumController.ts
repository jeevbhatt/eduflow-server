/**
 * Forum Controller
 *
 * Handles HTTP requests for discussion forums
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/forumController
 */

import { Response } from "express";
import { IExtendedRequest } from "../../middleware/type";
import {
  forumCategoryService,
  forumTopicService,
  forumPostService,
  RLSContext,
} from "../../services/prisma";

/**
 * Build RLS context from request
 */
const getRLSContext = (req: IExtendedRequest): RLSContext => ({
  userId: req.user?.id || "",
  userRole: req.user?.role || "student",
  instituteId: req.user?.currentInstituteId,
});

// ============================================
// CATEGORY ENDPOINTS
// ============================================

/**
 * Get all forum categories for an institute
 */
export const getCategories = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const categories = await forumCategoryService.getCategoriesWithCounts(
      context,
      instituteId
    );

    res.status(200).json({
      message: "Forum categories fetched successfully",
      data: categories,
    });
  } catch (error: any) {
    console.error("Error fetching forum categories:", error);
    res.status(500).json({
      message: "Error fetching forum categories",
      error: error.message,
    });
  }
};

/**
 * Create a forum category
 */
export const createCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { name, description, icon, color } = req.body;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await forumCategoryService.createCategory(context, {
      instituteId,
      name,
      description,
      icon,
      color,
    });

    res.status(201).json({
      message: "Forum category created successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error creating forum category:", error);
    res.status(500).json({
      message: "Error creating forum category",
      error: error.message,
    });
  }
};

/**
 * Update a forum category
 */
export const updateCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const category = await forumCategoryService.update(context, id, {
      name,
      description,
      icon,
      color,
    });

    res.status(200).json({
      message: "Forum category updated successfully",
      data: category,
    });
  } catch (error: any) {
    console.error("Error updating forum category:", error);
    res.status(500).json({
      message: "Error updating forum category",
      error: error.message,
    });
  }
};

/**
 * Delete a forum category
 */
export const deleteCategory = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { id } = req.params;

    await forumCategoryService.softDelete(context, id);

    res.status(200).json({
      message: "Forum category deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting forum category:", error);
    res.status(500).json({
      message: "Error deleting forum category",
      error: error.message,
    });
  }
};

// ============================================
// TOPIC ENDPOINTS
// ============================================

/**
 * Get topics for a category
 */
export const getCategoryTopics = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { categoryId } = req.params;
    const { page = "1", limit = "20", filter } = req.query;

    const topics = await forumTopicService.getCategoryTopics(
      context,
      categoryId,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filter: filter as "all" | "resolved" | "unresolved" | "pinned",
      }
    );

    res.status(200).json({
      message: "Forum topics fetched successfully",
      ...topics,
    });
  } catch (error: any) {
    console.error("Error fetching forum topics:", error);
    res.status(500).json({
      message: "Error fetching forum topics",
      error: error.message,
    });
  }
};

/**
 * Get trending topics
 */
export const getTrendingTopics = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { limit = "10" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const topics = await forumTopicService.getTrendingTopics(
      context,
      instituteId,
      parseInt(limit as string)
    );

    res.status(200).json({
      message: "Trending topics fetched successfully",
      data: topics,
    });
  } catch (error: any) {
    console.error("Error fetching trending topics:", error);
    res.status(500).json({
      message: "Error fetching trending topics",
      error: error.message,
    });
  }
};

/**
 * Get single topic
 */
export const getTopic = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;

    // Increment view count
    await forumTopicService.incrementViews(context, topicId);

    const topic = await forumTopicService.findById(context, topicId, {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
      category: {
        select: { id: true, name: true, color: true },
      },
    });

    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    res.status(200).json({
      message: "Topic fetched successfully",
      data: topic,
    });
  } catch (error: any) {
    console.error("Error fetching topic:", error);
    res.status(500).json({
      message: "Error fetching topic",
      error: error.message,
    });
  }
};

/**
 * Create a topic
 */
export const createTopic = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { categoryId, title, content, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!categoryId || !title || !content) {
      return res.status(400).json({
        message: "Category ID, title, and content are required",
      });
    }

    const topic = await forumTopicService.createTopic(context, {
      categoryId,
      authorId: userId,
      title,
      content,
      tags,
    });

    res.status(201).json({
      message: "Topic created successfully",
      data: topic,
    });
  } catch (error: any) {
    console.error("Error creating topic:", error);
    res.status(500).json({
      message: "Error creating topic",
      error: error.message,
    });
  }
};

/**
 * Update topic
 */
export const updateTopic = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;
    const { title, content, tags } = req.body;

    const topic = await forumTopicService.update(context, topicId, {
      title,
      content,
      tags,
    });

    res.status(200).json({
      message: "Topic updated successfully",
      data: topic,
    });
  } catch (error: any) {
    console.error("Error updating topic:", error);
    res.status(500).json({
      message: "Error updating topic",
      error: error.message,
    });
  }
};

/**
 * Delete topic
 */
export const deleteTopic = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;

    await forumTopicService.softDelete(context, topicId);

    res.status(200).json({
      message: "Topic deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting topic:", error);
    res.status(500).json({
      message: "Error deleting topic",
      error: error.message,
    });
  }
};

/**
 * Toggle upvote on topic
 */
export const toggleTopicUpvote = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;
    const userId = req.user?.id;
    const { isUpvote } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const topic = await forumTopicService.toggleUpvote(
      context,
      topicId,
      userId,
      isUpvote
    );

    res.status(200).json({
      message: isUpvote ? "Topic upvoted" : "Upvote removed",
      data: topic,
    });
  } catch (error: any) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({
      message: "Error toggling upvote",
      error: error.message,
    });
  }
};

/**
 * Mark topic as resolved
 */
export const markTopicResolved = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;
    const { isResolved } = req.body;

    const topic = await forumTopicService.markResolved(
      context,
      topicId,
      isResolved
    );

    res.status(200).json({
      message: isResolved ? "Topic marked as resolved" : "Topic unmarked",
      data: topic,
    });
  } catch (error: any) {
    console.error("Error marking topic resolved:", error);
    res.status(500).json({
      message: "Error marking topic resolved",
      error: error.message,
    });
  }
};

/**
 * Toggle pin on topic
 */
export const toggleTopicPin = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;
    const { isPinned } = req.body;

    const topic = await forumTopicService.togglePin(context, topicId, isPinned);

    res.status(200).json({
      message: isPinned ? "Topic pinned" : "Topic unpinned",
      data: topic,
    });
  } catch (error: any) {
    console.error("Error toggling pin:", error);
    res.status(500).json({
      message: "Error toggling pin",
      error: error.message,
    });
  }
};

/**
 * Search topics
 */
export const searchTopics = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { q, page = "1", limit = "20" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const results = await forumTopicService.searchTopics(
      context,
      instituteId,
      q as string,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(200).json({
      message: "Search completed",
      ...results,
    });
  } catch (error: any) {
    console.error("Error searching topics:", error);
    res.status(500).json({
      message: "Error searching topics",
      error: error.message,
    });
  }
};

// ============================================
// POST ENDPOINTS
// ============================================

/**
 * Get posts for a topic
 */
export const getTopicPosts = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { topicId } = req.params;
    const { page = "1", limit = "20" } = req.query;

    const posts = await forumPostService.getTopicPosts(context, topicId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Posts fetched successfully",
      ...posts,
    });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "Error fetching posts",
      error: error.message,
    });
  }
};

/**
 * Create a post/reply
 */
export const createPost = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { topicId, content, parentId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!topicId || !content) {
      return res.status(400).json({
        message: "Topic ID and content are required",
      });
    }

    const post = await forumPostService.createPost(context, {
      topicId,
      authorId: userId,
      content,
      parentId,
    });

    res.status(201).json({
      message: "Post created successfully",
      data: post,
    });
  } catch (error: any) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "Error creating post",
      error: error.message,
    });
  }
};

/**
 * Update a post
 */
export const updatePost = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { postId } = req.params;
    const { content } = req.body;

    const post = await forumPostService.update(context, postId, { content });

    res.status(200).json({
      message: "Post updated successfully",
      data: post,
    });
  } catch (error: any) {
    console.error("Error updating post:", error);
    res.status(500).json({
      message: "Error updating post",
      error: error.message,
    });
  }
};

/**
 * Delete a post
 */
export const deletePost = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { postId } = req.params;

    await forumPostService.softDelete(context, postId);

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      message: "Error deleting post",
      error: error.message,
    });
  }
};

/**
 * Mark post as accepted answer
 */
export const markAcceptedAnswer = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { postId } = req.params;
    const { topicId } = req.body;

    if (!topicId) {
      return res.status(400).json({ message: "Topic ID is required" });
    }

    const post = await forumPostService.markAsAcceptedAnswer(
      context,
      postId,
      topicId
    );

    res.status(200).json({
      message: "Answer accepted",
      data: post,
    });
  } catch (error: any) {
    console.error("Error marking accepted answer:", error);
    res.status(500).json({
      message: "Error marking accepted answer",
      error: error.message,
    });
  }
};

/**
 * Toggle upvote on post
 */
export const togglePostUpvote = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { postId } = req.params;
    const { isUpvote } = req.body;

    const post = await forumPostService.toggleUpvote(context, postId, isUpvote);

    res.status(200).json({
      message: isUpvote ? "Post upvoted" : "Upvote removed",
      data: post,
    });
  } catch (error: any) {
    console.error("Error toggling post upvote:", error);
    res.status(500).json({
      message: "Error toggling post upvote",
      error: error.message,
    });
  }
};
