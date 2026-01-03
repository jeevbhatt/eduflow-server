/**
 * Progress Routes (v2)
 *
 * Routes for student progress, achievements, and streaks with RLS protection
 *
 * @module route/v2/progressRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/progressController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, requireRole } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

// ============================================
// STUDENT PROGRESS ROUTES
// ============================================

router.post(
  "/lessons",
  isLoggedIn,
  asyncErrorHandler(controller.updateLessonProgress)
);

router.get(
  "/courses/:courseId",
  isLoggedIn,
  asyncErrorHandler(controller.getCourseProgress)
);

router.get("/stats", isLoggedIn, asyncErrorHandler(controller.getMyStats));

// ============================================
// ACHIEVEMENT ROUTES
// ============================================

router.get(
  "/achievements",
  isLoggedIn,
  asyncErrorHandler(controller.getAchievements)
);

// ============================================
// STREAK ROUTES
// ============================================

router.get("/streak", isLoggedIn, asyncErrorHandler(controller.getMyStreak));

router.get(
  "/streak/leaderboard",
  isLoggedIn,
  asyncErrorHandler(controller.getStreakLeaderboard)
);

router.post(
  "/activity",
  isLoggedIn,
  asyncErrorHandler(controller.recordActivity)
);

// ============================================
// ADMIN/TEACHER ROUTES
// ============================================

router.get(
  "/students/:studentId/courses/:courseId",
  isLoggedIn,
  requireRole(UserRole.Institute, UserRole.Teacher),
  asyncErrorHandler(controller.getStudentProgress)
);

router.get(
  "/students/:studentId/stats",
  isLoggedIn,
  requireRole(UserRole.Institute, UserRole.Teacher),
  asyncErrorHandler(controller.getStudentStats)
);

export default router;
