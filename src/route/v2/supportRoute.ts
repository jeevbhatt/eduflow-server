/**
 * Support Ticket Routes (v2)
 *
 * Routes for support tickets with RLS protection
 *
 * @module route/v2/supportRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/supportController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, requireRole } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

// ============================================
// USER ROUTES
// ============================================

router.get("/my", isLoggedIn, asyncErrorHandler(controller.getMyTickets));

router.route("/").post(isLoggedIn, asyncErrorHandler(controller.createTicket));

router.get(
  "/:ticketId",
  isLoggedIn,
  asyncErrorHandler(controller.getTicketDetails)
);

router.post(
  "/:ticketId/messages",
  isLoggedIn,
  asyncErrorHandler(controller.addMessage)
);

// ============================================
// ADMIN ROUTES
// ============================================

router.get(
  "/admin/all",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin, UserRole.Institute),
  asyncErrorHandler(controller.getAllTickets)
);

router.get(
  "/admin/statistics",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin, UserRole.Institute),
  asyncErrorHandler(controller.getStatistics)
);

router.post(
  "/:ticketId/assign",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin, UserRole.Institute),
  asyncErrorHandler(controller.assignTicket)
);

router.put(
  "/:ticketId/status",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin, UserRole.Institute),
  asyncErrorHandler(controller.updateTicketStatus)
);

export default router;
