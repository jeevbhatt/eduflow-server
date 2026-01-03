/**
 * Study Group Routes (v2)
 *
 * Routes for study groups and sessions with RLS protection
 *
 * @module route/v2/studyGroupRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/studyGroupController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn } from "../../middleware/middleware";

const router: Router = express.Router();

// ============================================
// STUDY GROUP ROUTES
// ============================================

router.get("/my", isLoggedIn, asyncErrorHandler(controller.getMyGroups));

router.get(
  "/discover",
  isLoggedIn,
  asyncErrorHandler(controller.getDiscoverableGroups)
);

router.route("/").post(isLoggedIn, asyncErrorHandler(controller.createGroup));

router
  .route("/:groupId")
  .get(isLoggedIn, asyncErrorHandler(controller.getGroupDetails))
  .put(isLoggedIn, asyncErrorHandler(controller.updateGroup))
  .delete(isLoggedIn, asyncErrorHandler(controller.deleteGroup));

router.post(
  "/:groupId/join",
  isLoggedIn,
  asyncErrorHandler(controller.joinGroup)
);

router.post(
  "/:groupId/leave",
  isLoggedIn,
  asyncErrorHandler(controller.leaveGroup)
);

router.put(
  "/:groupId/members/:memberId/role",
  isLoggedIn,
  asyncErrorHandler(controller.updateMemberRole)
);

// ============================================
// STUDY SESSION ROUTES
// ============================================

router.get(
  "/sessions/upcoming",
  isLoggedIn,
  asyncErrorHandler(controller.getUpcomingSessions)
);

router.get(
  "/:groupId/sessions",
  isLoggedIn,
  asyncErrorHandler(controller.getGroupSessions)
);

router
  .route("/sessions")
  .post(isLoggedIn, asyncErrorHandler(controller.createSession));

router
  .route("/sessions/:sessionId")
  .put(isLoggedIn, asyncErrorHandler(controller.updateSession))
  .delete(isLoggedIn, asyncErrorHandler(controller.deleteSession));

export default router;
