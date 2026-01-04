import { BaseRepository } from "@core/repository/BaseRepository";
import { FeeStructure, FeePayment } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class FinanceRepo extends BaseRepository<FeeStructure> {
  constructor() {
    super("feeStructure");
  }

  async getStructures(instituteId: string) {
    return this.model.findMany({
      where: { instituteId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getStudentPayments(studentId: string, instituteId: string) {
    return (prisma as any).feePayment.findMany({
      where: {
        studentId,
        instituteId,
      },
      include: {
        feeStructure: true,
      },
      orderBy: { paymentDate: "desc" },
    });
  }

  async getFinanceStats(instituteId: string) {
    const stats = await (prisma as any).feePayment.aggregate({
      where: { instituteId },
      _sum: {
        amountPaid: true,
        balance: true,
      },
      _count: {
        id: true,
      }
    });

    const recentPayments = await (prisma as any).feePayment.findMany({
      where: { instituteId },
      include: {
        student: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      stats: {
        totalCollected: stats._sum.amountPaid || 0,
        totalPending: stats._sum.balance || 0,
        totalTransactions: stats._count.id || 0,
      },
      recentPayments: recentPayments.map((p: any) => ({
        ...p,
        studentName: `${p.student.firstName} ${p.student.lastName}`
      }))
    };
  }
}

export default new FinanceRepo();
