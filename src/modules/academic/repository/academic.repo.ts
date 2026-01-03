import { BaseRepository } from "@core/repository/BaseRepository";
import { Assessment, AssessmentResult } from "@generated/prisma";
import prisma from "../../../core/database/prisma";

export class AcademicRepo extends BaseRepository<Assessment> {
  constructor() {
    super("assessment");
  }

  async getAssessments(courseId: string) {
    return this.model.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitResult(data: {
    assessmentId: string;
    studentId: string;
    score: number;
    remarks?: string;
    instituteId: string;
  }) {
    return (prisma as any).assessmentResult.create({
      data,
    });
  }

  async getResults(assessmentId: string) {
    return (prisma as any).assessmentResult.findMany({
      where: { assessmentId },
      include: {
        student: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { score: "desc" },
    });
  }
}

export default new AcademicRepo();
