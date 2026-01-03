/**
 * Payment Routes (v2)
 *
 * Routes for payments and transactions with RLS protection
 *
 * @module route/v2/paymentRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/paymentController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, requireRole } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

// ============================================
// USER ROUTES
// ============================================

router.get("/my", isLoggedIn, asyncErrorHandler(controller.getMyPayments));

router.route("/").post(isLoggedIn, asyncErrorHandler(controller.createPayment));

router.get(
  "/transaction/:transactionId",
  isLoggedIn,
  asyncErrorHandler(controller.getPaymentByTransactionId)
);

// ============================================
// WEBHOOK ROUTES
// ============================================

router.post(
  "/webhook/callback",
  asyncErrorHandler(controller.handlePaymentCallback)
);

// ============================================
// INSTITUTE ADMIN ROUTES
// ============================================

router.get(
  "/institute",
  isLoggedIn,
  requireRole(UserRole.Institute),
  asyncErrorHandler(controller.getInstitutePayments)
);

router.get(
  "/institute/statistics",
  isLoggedIn,
  requireRole(UserRole.Institute),
  asyncErrorHandler(controller.getRevenueStatistics)
);

router.post(
  "/:paymentId/refund",
  isLoggedIn,
  requireRole(UserRole.Institute),
  asyncErrorHandler(controller.processRefund)
);

export default router;
