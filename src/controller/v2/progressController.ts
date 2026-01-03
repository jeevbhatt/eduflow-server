/**
 * Progress Controller
 *
 * Handles HTTP requests for student progress, achievements, and streaks
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/progressController
 */

import { Response } from "express";
import { IExtendedRequest } from "../../middleware/type";
import {
  studentProgressService,
  achievementService,
  learningStreakService,
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
// PROGRESS ENDPOINTS
// ============================================

/**
 * Update lesson progress
 */
export const updateLessonProgress = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const studentId = req.user?.id;
    const { courseId, lessonId, progress, timeSpent } = req.body;

    if (!studentId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!courseId || !lessonId || progress === undefined) {
      return res.status(400).json({
        message: "Course ID, lesson ID, and progress are required",
      });
    }

    const updated = await studentProgressService.updateLessonProgress(context, {
      studentId,
      courseId,
      lessonId,
      progress,
      timeSpent: timeSpent || 0,
    });

    // Record activity for streak
    await learningStreakService.recordActivity(context, studentId);

    // Check for achievements
    const newAchievements = await achievementService.checkAndAwardAchievements(
      context,
      studentId,
      {
        type: progress >= 100 ? "lesson_complete" : "activity",
        data: { courseId, lessonId },
      }
    );

    res.status(200).json({
      message: "Progress updated successfully",
      data: {
        progress: updated,
        newAchievements,
      },
    });
  } catch (error: any) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      message: "Error updating progress",
      error: error.message,
    });
  }
};

/**
 * Get course progress
 */
export const getCourseProgress = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const studentId = req.user?.id;
    const { courseId } = req.params;

    if (!studentId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const progress = await studentProgressService.getCourseProgress(
      context,
      studentId,
      courseId
    );

    res.status(200).json({
      message: "Course progress fetched successfully",
      data: progress,
    });
  } catch (error: any) {
    console.error("Error fetching course progress:", error);
    res.status(500).json({
      message: "Error fetching course progress",
      error: error.message,
    });
  }
};

/**
 * Get student overall stats
 */
export const getMyStats = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const stats = await studentProgressService.getStudentStats(
      context,
      studentId
    );

    res.status(200).json({
      message: "Stats fetched successfully",
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      message: "Error fetching stats",
      error: error.message,
    });
  }
};

// ============================================
// ACHIEVEMENT ENDPOINTS
// ============================================

/**
 * Get all achievements with my progress
 */
export const getAchievements = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const achievements = await achievementService.getAchievementsWithProgress(
      context,
      studentId
    );

    res.status(200).json({
      message: "Achievements fetched successfully",
      data: achievements,
    });
  } catch (error: any) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({
      message: "Error fetching achievements",
      error: error.message,
    });
  }
};

// ============================================
// STREAK ENDPOINTS
// ============================================

/**
 * Get my learning streak
 */
export const getMyStreak = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const streak = await learningStreakService.getStreak(context, studentId);

    res.status(200).json({
      message: "Streak fetched successfully",
      data: streak,
    });
  } catch (error: any) {
    console.error("Error fetching streak:", error);
    res.status(500).json({
      message: "Error fetching streak",
      error: error.message,
    });
  }
};

/**
 * Get streak leaderboard
 */
export const getStreakLeaderboard = async (
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

    const leaderboard = await learningStreakService.getStreakLeaderboard(
      context,
      instituteId,
      parseInt(limit as string)
    );

    res.status(200).json({
      message: "Leaderboard fetched successfully",
      data: leaderboard,
    });
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      message: "Error fetching leaderboard",
      error: error.message,
    });
  }
};

/**
 * Record activity (manual trigger)
 */
export const recordActivity = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const streak = await learningStreakService.recordActivity(
      context,
      studentId
    );

    res.status(200).json({
      message: "Activity recorded successfully",
      data: streak,
    });
  } catch (error: any) {
    console.error("Error recording activity:", error);
    res.status(500).json({
      message: "Error recording activity",
      error: error.message,
    });
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get student progress (for teachers/admins)
 */
export const getStudentProgress = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { studentId, courseId } = req.params;

    const progress = await studentProgressService.getCourseProgress(
      context,
      studentId,
      courseId
    );

    res.status(200).json({
      message: "Student progress fetched successfully",
      data: progress,
    });
  } catch (error: any) {
    console.error("Error fetching student progress:", error);
    res.status(500).json({
      message: "Error fetching student progress",
      error: error.message,
    });
  }
};

/**
 * Get student stats (for teachers/admins)
 */
export const getStudentStats = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { studentId } = req.params;

    const stats = await studentProgressService.getStudentStats(
      context,
      studentId
    );

    res.status(200).json({
      message: "Student stats fetched successfully",
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({
      message: "Error fetching student stats",
      error: error.message,
    });
  }
};
