/**
 * Student Progress Service
 *
 * Handles student learning progress, achievements, and streaks
 * Tracks course completion, time spent, and gamification elements
 *
 * @module services/prisma/progressService
 */

import prisma from "../../database/prisma";
import {
  BasePrismaService,
  RLSContext,
  withRLSContext,
} from "./basePrismaService";
import {
  StudentProgress,
  Achievement,
  StudentAchievement,
  LearningStreak,
  Prisma,
} from "../../generated/prisma/client";

// ============================================
// STUDENT PROGRESS SERVICE
// ============================================

class StudentProgressService extends BasePrismaService<
  StudentProgress,
  Prisma.StudentProgressCreateInput,
  Prisma.StudentProgressUpdateInput,
  Prisma.StudentProgressWhereInput,
  Prisma.StudentProgressOrderByWithRelationInput
> {
  protected modelName = "StudentProgress";

  protected getDelegate() {
    return prisma.studentProgress;
  }

  /**
   * Get or create progress record
   */
  async getOrCreateProgress(
    context: RLSContext,
    data: {
      studentId: string;
      courseId: string;
      lessonId?: string;
    }
  ): Promise<StudentProgress> {
    return withRLSContext(context, async () => {
      const existing = await prisma.studentProgress.findUnique({
        where: {
          studentId_courseId_lessonId: {
            studentId: data.studentId,
            courseId: data.courseId,
            lessonId: data.lessonId || "",
          },
        },
      });

      if (existing) {
        return existing;
      }

      return prisma.studentProgress.create({
        data: {
          studentId: data.studentId,
          courseId: data.courseId,
          lessonId: data.lessonId,
        },
      });
    });
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(
    context: RLSContext,
    data: {
      studentId: string;
      courseId: string;
      lessonId: string;
      progress: number;
      timeSpent: number;
    }
  ): Promise<StudentProgress> {
    return withRLSContext(context, async () => {
      const progress = await this.getOrCreateProgress(context, data);

      const isCompleted = data.progress >= 100 && !progress.completedAt;

      return prisma.studentProgress.update({
        where: { id: progress.id },
        data: {
          progress: data.progress,
          timeSpent: { increment: data.timeSpent },
          lastAccessedAt: new Date(),
          completedAt: isCompleted ? new Date() : progress.completedAt,
        },
      });
    });
  }

  /**
   * Get course progress for student
   */
  async getCourseProgress(
    context: RLSContext,
    studentId: string,
    courseId: string
  ): Promise<{
    overallProgress: number;
    lessonsCompleted: number;
    totalLessons: number;
    timeSpent: number;
    lastAccessed: Date | null;
  }> {
    return withRLSContext(context, async () => {
      // Get total lessons in course
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          chapters: {
            include: {
              _count: { select: { lessons: true } },
            },
          },
        },
      });

      const totalLessons =
        course?.chapters.reduce((sum, ch) => sum + ch._count.lessons, 0) || 0;

      // Get student's progress records
      const progressRecords = await prisma.studentProgress.findMany({
        where: {
          studentId,
          courseId,
          lessonId: { not: null },
        },
      });

      const lessonsCompleted = progressRecords.filter(
        (p) => p.completedAt !== null
      ).length;

      const totalTimeSpent = progressRecords.reduce(
        (sum, p) => sum + p.timeSpent,
        0
      );

      const lastAccessed = progressRecords.reduce((latest, p) => {
        if (!p.lastAccessedAt) return latest;
        if (!latest) return p.lastAccessedAt;
        return p.lastAccessedAt > latest ? p.lastAccessedAt : latest;
      }, null as Date | null);

      const overallProgress =
        totalLessons > 0
          ? Math.round((lessonsCompleted / totalLessons) * 100)
          : 0;

      return {
        overallProgress,
        lessonsCompleted,
        totalLessons,
        timeSpent: totalTimeSpent,
        lastAccessed,
      };
    });
  }

  /**
   * Get student's overall stats
   */
  async getStudentStats(
    context: RLSContext,
    studentId: string
  ): Promise<{
    totalTimeSpent: number;
    coursesInProgress: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    averageProgress: number;
  }> {
    return withRLSContext(context, async () => {
      const progressRecords = await prisma.studentProgress.findMany({
        where: { studentId },
      });

      // Group by course
      const courseProgress = new Map<
        string,
        { total: number; completed: number; timeSpent: number }
      >();

      for (const record of progressRecords) {
        if (!record.lessonId) continue;

        const existing = courseProgress.get(record.courseId) || {
          total: 0,
          completed: 0,
          timeSpent: 0,
        };

        existing.total++;
        if (record.completedAt) existing.completed++;
        existing.timeSpent += record.timeSpent;

        courseProgress.set(record.courseId, existing);
      }

      let totalTimeSpent = 0;
      let coursesInProgress = 0;
      let coursesCompleted = 0;
      let lessonsCompleted = 0;
      let totalProgress = 0;

      for (const [, data] of courseProgress) {
        totalTimeSpent += data.timeSpent;
        lessonsCompleted += data.completed;

        const progress =
          data.total > 0 ? (data.completed / data.total) * 100 : 0;
        totalProgress += progress;

        if (progress >= 100) {
          coursesCompleted++;
        } else if (progress > 0) {
          coursesInProgress++;
        }
      }

      const averageProgress =
        courseProgress.size > 0 ? totalProgress / courseProgress.size : 0;

      return {
        totalTimeSpent,
        coursesInProgress,
        coursesCompleted,
        lessonsCompleted,
        averageProgress: Math.round(averageProgress),
      };
    });
  }
}

// ============================================
// ACHIEVEMENT SERVICE
// ============================================

class AchievementService extends BasePrismaService<
  Achievement,
  Prisma.AchievementCreateInput,
  Prisma.AchievementUpdateInput,
  Prisma.AchievementWhereInput,
  Prisma.AchievementOrderByWithRelationInput
> {
  protected modelName = "Achievement";

  protected getDelegate() {
    return prisma.achievement;
  }

  /**
   * Get all achievements with student's progress
   */
  async getAchievementsWithProgress(
    context: RLSContext,
    studentId: string
  ): Promise<Array<Achievement & { earned: boolean; earnedAt?: Date }>> {
    return withRLSContext(context, async () => {
      const achievements = await prisma.achievement.findMany({
        include: {
          earnedBy: {
            where: { studentId },
          },
        },
        orderBy: { points: "desc" },
      });

      return achievements.map((a) => ({
        ...a,
        earned: a.earnedBy.length > 0,
        earnedAt: a.earnedBy[0]?.earnedAt,
      }));
    });
  }

  /**
   * Award achievement to student
   */
  async awardAchievement(
    context: RLSContext,
    studentId: string,
    achievementId: string
  ): Promise<StudentAchievement> {
    return withRLSContext(context, async () => {
      // Check if already earned
      const existing = await prisma.studentAchievement.findUnique({
        where: {
          studentId_achievementId: { studentId, achievementId },
        },
      });

      if (existing) {
        return existing;
      }

      return prisma.studentAchievement.create({
        data: {
          studentId,
          achievementId,
        },
        include: {
          achievement: true,
        },
      });
    });
  }

  /**
   * Check and award achievements based on criteria
   */
  async checkAndAwardAchievements(
    context: RLSContext,
    studentId: string,
    event: {
      type: string;
      data: any;
    }
  ): Promise<Achievement[]> {
    return withRLSContext(context, async () => {
      const awardedAchievements: Achievement[] = [];

      // Get all unearned achievements
      const achievements = await prisma.achievement.findMany({
        where: {
          earnedBy: {
            none: { studentId },
          },
        },
      });

      for (const achievement of achievements) {
        const criteria = achievement.criteria as any;

        // Check if achievement criteria is met
        let earned = false;

        switch (criteria.type) {
          case "lessons_completed":
            if (event.type === "lesson_complete") {
              const stats = await studentProgressService.getStudentStats(
                context,
                studentId
              );
              earned = stats.lessonsCompleted >= criteria.count;
            }
            break;

          case "streak_days":
            if (event.type === "activity") {
              const streak = await learningStreakService.getStreak(
                context,
                studentId
              );
              earned = streak?.currentStreak >= criteria.days;
            }
            break;

          case "course_completed":
            if (event.type === "course_complete") {
              const stats = await studentProgressService.getStudentStats(
                context,
                studentId
              );
              earned = stats.coursesCompleted >= (criteria.count || 1);
            }
            break;

          case "time_spent":
            const stats = await studentProgressService.getStudentStats(
              context,
              studentId
            );
            earned = stats.totalTimeSpent >= criteria.hours * 3600;
            break;
        }

        if (earned) {
          await this.awardAchievement(context, studentId, achievement.id);
          awardedAchievements.push(achievement);
        }
      }

      return awardedAchievements;
    });
  }
}

// ============================================
// LEARNING STREAK SERVICE
// ============================================

class LearningStreakService extends BasePrismaService<
  LearningStreak,
  Prisma.LearningStreakCreateInput,
  Prisma.LearningStreakUpdateInput,
  Prisma.LearningStreakWhereInput,
  Prisma.LearningStreakOrderByWithRelationInput
> {
  protected modelName = "LearningStreak";

  protected getDelegate() {
    return prisma.learningStreak;
  }

  /**
   * Get or create streak record
   */
  async getStreak(
    context: RLSContext,
    studentId: string
  ): Promise<LearningStreak> {
    return withRLSContext(context, async () => {
      const existing = await prisma.learningStreak.findUnique({
        where: { studentId },
      });

      if (existing) {
        return existing;
      }

      return prisma.learningStreak.create({
        data: {
          studentId,
          lastActivityDate: new Date(),
        },
      });
    });
  }

  /**
   * Record activity and update streak
   */
  async recordActivity(
    context: RLSContext,
    studentId: string
  ): Promise<LearningStreak> {
    return withRLSContext(context, async () => {
      const streak = await this.getStreak(context, studentId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStreak = streak.currentStreak;

      if (daysDiff === 0) {
        // Same day, no update needed
        return streak;
      } else if (daysDiff === 1) {
        // Consecutive day
        newStreak++;
      } else {
        // Streak broken
        newStreak = 1;
      }

      const longestStreak = Math.max(newStreak, streak.longestStreak);

      return prisma.learningStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newStreak,
          longestStreak,
          lastActivityDate: today,
        },
      });
    });
  }

  /**
   * Get leaderboard by streak
   */
  async getStreakLeaderboard(
    context: RLSContext,
    instituteId: string,
    limit: number = 10
  ): Promise<
    Array<{
      student: { id: string; firstName: string; lastName: string };
      currentStreak: number;
      longestStreak: number;
    }>
  > {
    return withRLSContext(context, async () => {
      const streaks = await prisma.learningStreak.findMany({
        where: {
          student: { instituteId },
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { currentStreak: "desc" },
        take: limit,
      });

      return streaks.map((s) => ({
        student: s.student,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
      }));
    });
  }
}

// Export singleton instances
export const studentProgressService = new StudentProgressService();
export const achievementService = new AchievementService();
export const learningStreakService = new LearningStreakService();
