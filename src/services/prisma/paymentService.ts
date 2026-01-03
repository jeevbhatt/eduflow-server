/**
 * Payment Service
 * Matches Prisma schema: Payment with PaymentType, PaymentStatus
 * Note: Payments are institute-level (subscriptions), not user/course level
 */

import prisma from "../../database/prisma";
import {
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  Payment,
  PaymentType,
  PaymentStatus,
  Prisma,
} from "../../generated/prisma/client";

// DTO Types
interface CreatePaymentDTO {
  instituteId: string;
  amount: number | Prisma.Decimal;
  currency?: string;
  type: PaymentType;
  paymentMethod?: string;
  transactionId?: string;
  invoiceNumber?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface UpdatePaymentDTO {
  status?: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
}

interface PaymentFilters {
  instituteId?: string;
  type?: PaymentType;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

interface PaymentStats {
  totalRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  refundedAmount: number;
}

// ===========================================
// PAYMENT CRUD
// ===========================================

/**
 * Create a payment record
 */
export async function createPayment(
  ctx: RLSContext,
  data: CreatePaymentDTO
): Promise<Payment> {
  return withRLSContext(ctx, async (tx) => {
    return tx.payment.create({
      data: {
        instituteId: data.instituteId,
        amount: data.amount,
        currency: data.currency || "USD",
        type: data.type,
        status: PaymentStatus.pending,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        invoiceNumber: data.invoiceNumber,
        description: data.description,
        metadata: data.metadata,
      },
      include: {
        institute: {
          select: { id: true, instituteName: true, email: true },
        },
      },
    });
  });
}

/**
 * Get payment by ID
 */
export async function getPayment(
  ctx: RLSContext,
  paymentId: string
): Promise<Payment | null> {
  return withRLSContext(ctx, async (tx) => {
    return tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        institute: {
          select: { id: true, instituteName: true, email: true },
        },
      },
    });
  });
}

/**
 * Update payment
 */
export async function updatePayment(
  ctx: RLSContext,
  paymentId: string,
  data: UpdatePaymentDTO
): Promise<Payment> {
  return withRLSContext(ctx, async (tx) => {
    return tx.payment.update({
      where: { id: paymentId },
      data: {
        ...data,
        paidAt:
          data.status === PaymentStatus.completed ? new Date() : data.paidAt,
      },
      include: {
        institute: {
          select: { id: true, instituteName: true, email: true },
        },
      },
    });
  });
}

/**
 * Mark payment as completed
 */
export async function markAsCompleted(
  ctx: RLSContext,
  paymentId: string,
  transactionId?: string
): Promise<Payment> {
  return updatePayment(ctx, paymentId, {
    status: PaymentStatus.completed,
    transactionId,
    paidAt: new Date(),
  });
}

/**
 * Mark payment as failed
 */
export async function markAsFailed(
  ctx: RLSContext,
  paymentId: string
): Promise<Payment> {
  return updatePayment(ctx, paymentId, {
    status: PaymentStatus.failed,
  });
}

/**
 * Process refund
 */
export async function processRefund(
  ctx: RLSContext,
  originalPaymentId: string,
  amount?: number
): Promise<Payment> {
  return withRLSContext(ctx, async (tx) => {
    const originalPayment = await tx.payment.findUnique({
      where: { id: originalPaymentId },
    });

    if (!originalPayment) {
      throw new Error("Original payment not found");
    }

    if (originalPayment.status !== PaymentStatus.completed) {
      throw new Error("Can only refund completed payments");
    }

    // Create refund payment record
    const refundAmount = amount || Number(originalPayment.amount);

    const refund = await tx.payment.create({
      data: {
        instituteId: originalPayment.instituteId,
        amount: refundAmount,
        currency: originalPayment.currency,
        type: PaymentType.refund,
        status: PaymentStatus.completed,
        paymentMethod: originalPayment.paymentMethod,
        description: `Refund for payment ${originalPaymentId}`,
        metadata: {
          originalPaymentId,
          refundedAt: new Date().toISOString(),
        },
        paidAt: new Date(),
      },
    });

    // Update original payment status
    await tx.payment.update({
      where: { id: originalPaymentId },
      data: {
        status: PaymentStatus.refunded,
        metadata: {
          ...((originalPayment.metadata as object) || {}),
          refundId: refund.id,
          refundedAt: new Date().toISOString(),
        },
      },
    });

    return refund;
  });
}

// ===========================================
// QUERIES
// ===========================================

/**
 * Get payments with filters and pagination
 */
export async function getPayments(
  ctx: RLSContext,
  filters: PaymentFilters = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Payment>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filters.instituteId) whereClause.instituteId = filters.instituteId;
    if (filters.type) whereClause.type = filters.type;
    if (filters.status) whereClause.status = filters.status;

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const [payments, total] = await Promise.all([
      tx.payment.findMany({
        where: whereClause,
        include: {
          institute: {
            select: { id: true, instituteName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      tx.payment.count({ where: whereClause }),
    ]);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  });
}

/**
 * Get payments for an institute
 */
export async function getInstitutePayments(
  ctx: RLSContext,
  instituteId: string,
  options: PaginationOptions = {}
): Promise<PaginatedResult<Payment>> {
  return getPayments(ctx, { instituteId }, options);
}

/**
 * Get payment by transaction ID
 */
export async function getPaymentByTransactionId(
  ctx: RLSContext,
  transactionId: string
): Promise<Payment | null> {
  return withRLSContext(ctx, async (tx) => {
    return tx.payment.findFirst({
      where: { transactionId },
      include: {
        institute: {
          select: { id: true, instituteName: true, email: true },
        },
      },
    });
  });
}

// ===========================================
// STATISTICS
// ===========================================

/**
 * Get payment statistics
 */
export async function getPaymentStats(
  ctx: RLSContext,
  filters: { instituteId?: string; startDate?: Date; endDate?: Date } = {}
): Promise<PaymentStats> {
  return withRLSContext(ctx, async (tx) => {
    const whereClause: any = {
      type: { not: PaymentType.refund },
    };

    if (filters.instituteId) whereClause.instituteId = filters.instituteId;
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const [payments, refunds] = await Promise.all([
      tx.payment.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true },
      }),
      tx.payment.aggregate({
        where: {
          ...whereClause,
          type: PaymentType.refund,
          status: PaymentStatus.completed,
        },
        _sum: { amount: true },
      }),
    ]);

    const [pending, completed, failed] = await Promise.all([
      tx.payment.count({
        where: { ...whereClause, status: PaymentStatus.pending },
      }),
      tx.payment.count({
        where: { ...whereClause, status: PaymentStatus.completed },
      }),
      tx.payment.count({
        where: { ...whereClause, status: PaymentStatus.failed },
      }),
    ]);

    return {
      totalRevenue: Number(payments._sum.amount || 0),
      totalPayments: payments._count.id,
      pendingPayments: pending,
      completedPayments: completed,
      failedPayments: failed,
      refundedAmount: Number(refunds._sum.amount || 0),
    };
  });
}

/**
 * Get monthly revenue breakdown
 */
export async function getMonthlyRevenue(
  ctx: RLSContext,
  year: number
): Promise<{ month: number; revenue: number; count: number }[]> {
  return withRLSContext(ctx, async (tx) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const payments = await tx.payment.findMany({
      where: {
        status: PaymentStatus.completed,
        type: { not: PaymentType.refund },
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    // Group by month
    const monthlyData: Record<number, { revenue: number; count: number }> = {};
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { revenue: 0, count: 0 };
    }

    for (const payment of payments) {
      if (payment.paidAt) {
        const month = payment.paidAt.getMonth();
        monthlyData[month].revenue += Number(payment.amount);
        monthlyData[month].count += 1;
      }
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: parseInt(month) + 1, // 1-12
      revenue: data.revenue,
      count: data.count,
    }));
  });
}

/**
 * Get revenue by payment type
 */
export async function getRevenueByType(
  ctx: RLSContext,
  filters: { startDate?: Date; endDate?: Date } = {}
): Promise<{ type: PaymentType; revenue: number; count: number }[]> {
  return withRLSContext(ctx, async (tx) => {
    const whereClause: any = {
      status: PaymentStatus.completed,
    };

    if (filters.startDate || filters.endDate) {
      whereClause.paidAt = {};
      if (filters.startDate) whereClause.paidAt.gte = filters.startDate;
      if (filters.endDate) whereClause.paidAt.lte = filters.endDate;
    }

    const grouped = await tx.payment.groupBy({
      by: ["type"],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    });

    return grouped.map((g) => ({
      type: g.type,
      revenue: Number(g._sum.amount || 0),
      count: g._count.id,
    }));
  });
}

// ===========================================
// INVOICES
// ===========================================

/**
 * Generate invoice number
 */
export async function generateInvoiceNumber(ctx: RLSContext): Promise<string> {
  return withRLSContext(ctx, async (tx) => {
    const year = new Date().getFullYear();
    const count = await tx.payment.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}`,
        },
      },
    });

    return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
  });
}

// Export all functions as a service object
export const paymentService = {
  createPayment,
  getPayment,
  updatePayment,
  markAsCompleted,
  markAsFailed,
  processRefund,
  getPayments,
  getInstitutePayments,
  getPaymentByTransactionId,
  getPaymentStats,
  getMonthlyRevenue,
  getRevenueByType,
  generateInvoiceNumber,
};
