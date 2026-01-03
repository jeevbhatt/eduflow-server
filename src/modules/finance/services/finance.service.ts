import financeRepo from "../repository/finance.repo";
import prisma from "../../../core/database/prisma";

export class FinanceService {
  async getFeeStructures(instituteId: string) {
    return financeRepo.getStructures(instituteId);
  }

  async createFeeStructure(instituteId: string, data: any) {
    return financeRepo.create({
      ...data,
      instituteId,
    });
  }

  async recordPayment(instituteId: string, data: any) {
    const { studentId, feeStructureId, amountPaid, paymentDate, paymentMethod, remarks } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Get structure
      const structure = await tx.feeStructure.findUnique({
        where: { id: feeStructureId }
      });

      if (!structure) throw new Error("Fee structure not found");

      // 2. Calculate balance
      const previousPayments = await tx.feePayment.aggregate({
        where: { studentId, feeStructureId },
        _sum: { amountPaid: true }
      });

      const totalPaidSoFar = Number(previousPayments._sum.amountPaid) || 0;
      const totalAmount = Number(structure.amount);
      const newBalance = totalAmount - (totalPaidSoFar + Number(amountPaid));
      const status = newBalance <= 0 ? "paid" : "partial";

      const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

      // 3. Create payment
      return tx.feePayment.create({
        data: {
          instituteId,
          studentId,
          feeStructureId,
          amountPaid,
          balance: newBalance,
          paymentDate: new Date(paymentDate),
          paymentMethod: paymentMethod || "cash",
          status,
          receiptNumber,
          remarks,
        }
      });
    });
  }

  async getStudentPayments(studentId: string, instituteId: string) {
    return financeRepo.getStudentPayments(studentId, instituteId);
  }

  async getFinanceStats(instituteId: string) {
    return financeRepo.getFinanceStats(instituteId);
  }
}

export default new FinanceService();
