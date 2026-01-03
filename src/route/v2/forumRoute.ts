/**
 * Forum Routes (v2)
 *
 * Routes for discussion forums with RLS protection
 *
 * @module route/v2/forumRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/forumController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, requireRole } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

// ============================================
// CATEGORY ROUTES
// ============================================

router
  .route("/categories")
  .get(isLoggedIn, asyncErrorHandler(controller.getCategories))
  .post(
    isLoggedIn,
    requireRole(UserRole.Institute, UserRole.Teacher),
    asyncErrorHandler(controller.createCategory)
  );

router
  .route("/categories/:id")
  .put(
    isLoggedIn,
    requireRole(UserRole.Institute, UserRole.Teacher),
    asyncErrorHandler(controller.updateCategory)
  )
  .delete(
    isLoggedIn,
    requireRole(UserRole.Institute),
    asyncErrorHandler(controller.deleteCategory)
  );

// ============================================
// TOPIC ROUTES
// ============================================

router.get(
  "/topics/trending",
  isLoggedIn,
  asyncErrorHandler(controller.getTrendingTopics)
);

router.get(
  "/topics/search",
  isLoggedIn,
  asyncErrorHandler(controller.searchTopics)
);

router.get(
  "/categories/:categoryId/topics",
  isLoggedIn,
  asyncErrorHandler(controller.getCategoryTopics)
);

router
  .route("/topics")
  .post(isLoggedIn, asyncErrorHandler(controller.createTopic));

router
  .route("/topics/:topicId")
  .get(isLoggedIn, asyncErrorHandler(controller.getTopic))
  .put(isLoggedIn, asyncErrorHandler(controller.updateTopic))
  .delete(isLoggedIn, asyncErrorHandler(controller.deleteTopic));

router.post(
  "/topics/:topicId/upvote",
  isLoggedIn,
  asyncErrorHandler(controller.toggleTopicUpvote)
);

router.post(
  "/topics/:topicId/resolve",
  isLoggedIn,
  asyncErrorHandler(controller.markTopicResolved)
);

router.post(
  "/topics/:topicId/pin",
  isLoggedIn,
  requireRole(UserRole.Institute, UserRole.Teacher),
  asyncErrorHandler(controller.toggleTopicPin)
);

// ============================================
// POST ROUTES
// ============================================

router.get(
  "/topics/:topicId/posts",
  isLoggedIn,
  asyncErrorHandler(controller.getTopicPosts)
);

router
  .route("/posts")
  .post(isLoggedIn, asyncErrorHandler(controller.createPost));

router
  .route("/posts/:postId")
  .put(isLoggedIn, asyncErrorHandler(controller.updatePost))
  .delete(isLoggedIn, asyncErrorHandler(controller.deletePost));

router.post(
  "/posts/:postId/upvote",
  isLoggedIn,
  asyncErrorHandler(controller.togglePostUpvote)
);

router.post(
  "/posts/:postId/accept",
  isLoggedIn,
  asyncErrorHandler(controller.markAcceptedAnswer)
);

export default router;
