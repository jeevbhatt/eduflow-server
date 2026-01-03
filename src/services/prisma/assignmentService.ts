/**
 * Assignment Service
 *
 * Handles assignment creation, submission, and grading
 * Simplified to match actual Prisma schema
 *
 * @module services/prisma/assignmentService
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
  Assignment,
  AssignmentSubmission,
  AssignmentPriority,
  SubmissionStatus,
  Prisma,
} from "../../generated/prisma/client";

// ============================================
// ASSIGNMENT SERVICE
// ============================================

class AssignmentService extends BasePrismaService<
  Assignment,
  Prisma.AssignmentCreateInput,
  Prisma.AssignmentUpdateInput,
  Prisma.AssignmentWhereInput,
  Prisma.AssignmentOrderByWithRelationInput
> {
  protected modelName = "Assignment";

  protected getDelegate() {
    return prisma.assignment;
  }

  /**
   * Get assignments for a course
   */
  async getCourseAssignments(
    context: RLSContext,
    courseId: string,
    options: PaginationOptions & {
      status?: "upcoming" | "past" | "all";
    }
  ): Promise<PaginatedResult<Assignment>> {
    const where: Prisma.AssignmentWhereInput = {
      courseId,
      deletedAt: null,
    };

    const now = new Date();
    if (options.status === "upcoming") {
      where.dueDate = { gte: now };
    } else if (options.status === "past") {
      where.dueDate = { lt: now };
    }

    return this.findMany(context, {
      ...options,
      where,
      orderBy: { dueDate: "asc" },
    });
  }

  /**
   * Get student's assignments across all courses
   */
  async getStudentAssignments(
    context: RLSContext,
    studentId: string,
    options: PaginationOptions & {
      status?: "pending" | "submitted" | "graded" | "all";
    }
  ): Promise<AssignmentSubmission[]> {
    return withRLSContext(context, async (tx) => {
      // Get all submissions for this student
      const submissions = await tx.assignmentSubmission.findMany({
        where: {
          studentId,
          ...(options.status && options.status !== "all"
            ? { status: options.status as SubmissionStatus }
            : {}),
        },
        include: {
          assignment: true,
        },
        orderBy: {
          assignment: { dueDate: "asc" },
        },
      });

      return submissions;
    });
  }

  /**
   * Get assignment with full details
   */
  async getAssignmentDetails(
    context: RLSContext,
    assignmentId: string,
    studentId?: string
  ): Promise<
    | (Assignment & {
        stats: {
          totalSubmissions: number;
          submittedCount: number;
          gradedCount: number;
        };
      })
    | null
  > {
    return withRLSContext(context, async (tx) => {
      const assignment = await tx.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          submissions: studentId
            ? {
                where: { studentId },
              }
            : true,
        },
      });

      if (!assignment) return null;

      const totalSubmissions = assignment.submissions.length;
      const submittedCount = assignment.submissions.filter(
        (s) => s.status === SubmissionStatus.submitted
      ).length;
      const gradedCount = assignment.submissions.filter(
        (s) => s.status === SubmissionStatus.graded
      ).length;

      return {
        ...assignment,
        stats: {
          totalSubmissions,
          submittedCount,
          gradedCount,
        },
      };
    });
  }

  /**
   * Create a new assignment
   */
  async createAssignment(
    context: RLSContext,
    data: {
      instituteId: string;
      courseId: string;
      chapterId?: string;
      title: string;
      description?: string;
      instructions?: string;
      dueDate: Date;
      dueTime?: string;
      maxPoints?: number;
      priority?: AssignmentPriority;
      allowLateSubmission?: boolean;
      latePenalty?: number;
      attachments?: string[];
      createdBy: string;
    }
  ): Promise<Assignment> {
    return withRLSContext(context, async (tx) => {
      return tx.assignment.create({
        data: {
          instituteId: data.instituteId,
          courseId: data.courseId,
          chapterId: data.chapterId,
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          dueDate: data.dueDate,
          dueTime: data.dueTime,
          maxPoints: data.maxPoints ?? 100,
          priority: data.priority ?? AssignmentPriority.medium,
          allowLateSubmission: data.allowLateSubmission ?? false,
          latePenalty: data.latePenalty ?? 0,
          attachments: data.attachments ?? [],
          createdBy: data.createdBy,
        },
      });
    });
  }
}

// ============================================
// ASSIGNMENT SUBMISSION SERVICE
// ============================================

class AssignmentSubmissionService extends BasePrismaService<
  AssignmentSubmission,
  Prisma.AssignmentSubmissionCreateInput,
  Prisma.AssignmentSubmissionUpdateInput,
  Prisma.AssignmentSubmissionWhereInput,
  Prisma.AssignmentSubmissionOrderByWithRelationInput
> {
  protected modelName = "AssignmentSubmission";

  protected getDelegate() {
    return prisma.assignmentSubmission;
  }

  /**
   * Submit an assignment
   */
  async submitAssignment(
    context: RLSContext,
    data: {
      assignmentId: string;
      studentId: string;
      content?: string;
      attachments?: string[];
    }
  ): Promise<AssignmentSubmission> {
    return withRLSContext(context, async (tx) => {
      // Check if already submitted
      const existing = await tx.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
          },
        },
      });

      if (existing && existing.status !== SubmissionStatus.pending) {
        throw new Error("Assignment already submitted");
      }

      // Get assignment to check due date
      const assignment = await tx.assignment.findUnique({
        where: { id: data.assignmentId },
      });

      if (!assignment) {
        throw new Error("Assignment not found");
      }

      const isLate = new Date() > assignment.dueDate;

      if (isLate && !assignment.allowLateSubmission) {
        throw new Error("Late submissions not allowed");
      }

      if (existing) {
        return tx.assignmentSubmission.update({
          where: { id: existing.id },
          data: {
            content: data.content,
            attachments: data.attachments ?? [],
            status: SubmissionStatus.submitted,
            submittedAt: new Date(),
            isLate,
          },
        });
      }

      return tx.assignmentSubmission.create({
        data: {
          assignmentId: data.assignmentId,
          studentId: data.studentId,
          content: data.content,
          attachments: data.attachments ?? [],
          status: SubmissionStatus.submitted,
          submittedAt: new Date(),
          isLate,
        },
      });
    });
  }

  /**
   * Grade a submission
   */
  async gradeSubmission(
    context: RLSContext,
    submissionId: string,
    data: {
      grade: number;
      feedback?: string;
      gradedBy: string;
    }
  ): Promise<AssignmentSubmission> {
    return withRLSContext(context, async (tx) => {
      const submission = await tx.assignmentSubmission.findUnique({
        where: { id: submissionId },
        include: { assignment: true },
      });

      if (!submission) {
        throw new Error("Submission not found");
      }

      // Apply late penalty if applicable
      let finalGrade = data.grade;
      if (submission.isLate && submission.assignment.latePenalty > 0) {
        finalGrade = Math.max(
          0,
          data.grade * (1 - submission.assignment.latePenalty / 100)
        );
      }

      return tx.assignmentSubmission.update({
        where: { id: submissionId },
        data: {
          grade: Math.round(finalGrade),
          feedback: data.feedback,
          gradedBy: data.gradedBy,
          gradedAt: new Date(),
          status: SubmissionStatus.graded,
        },
      });
    });
  }

  /**
   * Get submissions for an assignment
   */
  async getAssignmentSubmissions(
    context: RLSContext,
    assignmentId: string,
    options: PaginationOptions & {
      status?: SubmissionStatus;
    }
  ): Promise<PaginatedResult<AssignmentSubmission>> {
    const where: Prisma.AssignmentSubmissionWhereInput = {
      assignmentId,
      ...(options.status ? { status: options.status } : {}),
    };

    return this.findMany(context, {
      ...options,
      where,
    });
  }

  /**
   * Get student's submission for an assignment
   */
  async getStudentSubmission(
    context: RLSContext,
    assignmentId: string,
    studentId: string
  ): Promise<AssignmentSubmission | null> {
    return withRLSContext(context, async (tx) => {
      return tx.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId,
          },
        },
        include: {
          assignment: true,
        },
      });
    });
  }
}

// Export singleton instances
export const assignmentService = new AssignmentService();
export const assignmentSubmissionService = new AssignmentSubmissionService();

// Export classes for testing
export { AssignmentService, AssignmentSubmissionService };
