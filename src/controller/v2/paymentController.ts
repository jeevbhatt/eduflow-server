/**
 * Payment Controller
 *
 * Handles HTTP requests for payments and transactions
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/paymentController
 */

import { Response } from "express";
import { IExtendedRequest } from "../../middleware/type";
import { paymentService, RLSContext } from "../../services/prisma";
import { PaymentStatus, PaymentType } from "../../generated/prisma/client";

/**
 * Build RLS context from request
 */
const getRLSContext = (req: IExtendedRequest): RLSContext => ({
  userId: req.user?.id || "",
  userRole: req.user?.role || "student",
  instituteId: req.user?.currentInstituteId,
});

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Get my payments
 */
export const getMyPayments = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { status, page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payments = await paymentService.getPayments(
      context,
      { status: status as PaymentStatus | undefined },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(200).json({
      message: "Payments fetched successfully",
      ...payments,
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      message: "Error fetching payments",
      error: error.message,
    });
  }
};

/**
 * Create a payment (initiate)
 */
export const createPayment = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { courseId, amount, currency, paymentMethod, metadata } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!courseId || !amount || !paymentMethod) {
      return res.status(400).json({
        message: "Course ID, amount, and payment method are required",
      });
    }

    // Get institute ID from course (in real implementation)
    const instituteId = req.user?.currentInstituteId;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const payment = await paymentService.createPayment(context, {
      instituteId,
      type: "subscription" as any,
      amount,
      currency,
      paymentMethod: paymentMethod as string,
      metadata,
    });

    res.status(201).json({
      message: "Payment initiated successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      message: "Error creating payment",
      error: error.message,
    });
  }
};

/**
 * Get payment by transaction ID
 */
export const getPaymentByTransactionId = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { transactionId } = req.params;

    const payment = await paymentService.getPayment(context, transactionId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({
      message: "Payment fetched successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      message: "Error fetching payment",
      error: error.message,
    });
  }
};

// ============================================
// WEBHOOK ENDPOINTS
// ============================================

/**
 * Handle payment gateway callback/webhook
 */
export const handlePaymentCallback = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { transactionId, status, gatewayResponse } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({
        message: "Transaction ID and status are required",
      });
    }

    const payment = await paymentService.updatePayment(context, transactionId, {
      status: status as PaymentStatus,
    });

    res.status(200).json({
      message: "Payment status updated successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Error handling payment callback:", error);
    res.status(500).json({
      message: "Error handling payment callback",
      error: error.message,
    });
  }
};

// ============================================
// INSTITUTE ADMIN ENDPOINTS
// ============================================

/**
 * Get institute payments (revenue)
 */
export const getInstitutePayments = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { status, dateFrom, dateTo, page = "1", limit = "20" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const payments = await paymentService.getPayments(
      context,
      { status: status as PaymentStatus | undefined },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(200).json({
      message: "Institute payments fetched successfully",
      ...payments,
    });
  } catch (error: any) {
    console.error("Error fetching institute payments:", error);
    res.status(500).json({
      message: "Error fetching institute payments",
      error: error.message,
    });
  }
};

/**
 * Get revenue statistics
 */
export const getRevenueStatistics = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { period = "month" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const stats = await paymentService.getPaymentStats(context);

    res.status(200).json({
      message: "Revenue statistics fetched successfully",
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching revenue statistics:", error);
    res.status(500).json({
      message: "Error fetching revenue statistics",
      error: error.message,
    });
  }
};

/**
 * Process refund
 */
export const processRefund = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { paymentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Refund reason is required" });
    }

    const payment = await paymentService.processRefund(
      context,
      paymentId,
      reason
    );

    res.status(200).json({
      message: "Refund processed successfully",
      data: payment,
    });
  } catch (error: any) {
    console.error("Error processing refund:", error);
    res.status(400).json({
      message: error.message || "Error processing refund",
    });
  }
};
