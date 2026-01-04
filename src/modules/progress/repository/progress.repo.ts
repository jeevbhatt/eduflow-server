import { BaseRepository } from "@core/repository/BaseRepository";
import { StudentProgress, StudentAchievement } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class ProgressRepo extends BaseRepository<StudentProgress> {
  constructor() {
    super("studentProgress");
  }

  async updateProgress(data: {
    studentId: string;
    courseId: string;
    lessonId: string;
    completed: boolean;
    instituteId: string;
  }) {
    return this.model.upsert({
      where: {
        studentId_courseId_lessonId: {
          studentId: data.studentId,
          courseId: data.courseId,
          lessonId: data.lessonId,
        },
      },
      update: { completed: data.completed },
      create: data,
    });
  }

  async getProgress(studentId: string, courseId: string) {
    return this.model.findMany({
      where: { studentId, courseId },
      include: { lesson: true },
    });
  }

  async getAchievements(studentId: string) {
    return (prisma as any).studentAchievement.findMany({
      where: { studentId },
    });
  }
}

export default new ProgressRepo();
