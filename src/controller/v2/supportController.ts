/**
 * Support Ticket Controller
 *
 * Handles HTTP requests for support tickets
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/supportController
 */

import { Response } from "express";
import { IExtendedRequest, UserRole } from "../../middleware/type";
import {
  supportTicketService,
  supportTicketMessageService,
  RLSContext,
} from "../../services/prisma";
import { TicketPriority, TicketStatus } from "../../generated/prisma/client";

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
 * Get my tickets
 */
export const getMyTickets = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { status, page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const tickets = await supportTicketService.getUserTickets(context, userId, {
      status: status as TicketStatus | undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Tickets fetched successfully",
      ...tickets,
    });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      message: "Error fetching tickets",
      error: error.message,
    });
  }
};

/**
 * Create a ticket
 */
export const createTicket = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const instituteId = req.user?.currentInstituteId;
    const { subject, description, category, priority } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!subject || !description || !category) {
      return res.status(400).json({
        message: "Subject, description, and category are required",
      });
    }

    const ticket = await supportTicketService.createTicket(context, {
      userId,
      instituteId: instituteId || undefined,
      subject,
      description,
      category,
      priority: priority as TicketPriority | undefined,
    });

    res.status(201).json({
      message: "Ticket created successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    res.status(500).json({
      message: "Error creating ticket",
      error: error.message,
    });
  }
};

/**
 * Get ticket details
 */
export const getTicketDetails = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { ticketId } = req.params;
    const isAdmin =
      req.user?.role === UserRole.SuperAdmin ||
      req.user?.role === UserRole.Institute;

    const ticket = await supportTicketService.getTicketDetails(
      context,
      ticketId,
      isAdmin // Include internal notes for admins
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      message: "Ticket fetched successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({
      message: "Error fetching ticket",
      error: error.message,
    });
  }
};

/**
 * Add message to ticket
 */
export const addMessage = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { ticketId } = req.params;
    const { content, isInternal, attachments } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!content) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const message = await supportTicketMessageService.addMessage(context, {
      ticketId,
      senderId: userId,
      content,
      isInternal,
      attachments,
    });

    res.status(201).json({
      message: "Message added successfully",
      data: message,
    });
  } catch (error: any) {
    console.error("Error adding message:", error);
    res.status(500).json({
      message: "Error adding message",
      error: error.message,
    });
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get all tickets (admin)
 */
export const getAllTickets = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const {
      status,
      priority,
      assignedTo,
      unassigned,
      page = "1",
      limit = "20",
    } = req.query;

    const tickets = await supportTicketService.getAllTickets(context, {
      status: status as TicketStatus | undefined,
      priority: priority as TicketPriority | undefined,
      assignedTo: assignedTo as string | undefined,
      unassigned: unassigned === "true",
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Tickets fetched successfully",
      ...tickets,
    });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      message: "Error fetching tickets",
      error: error.message,
    });
  }
};

/**
 * Assign ticket
 */
export const assignTicket = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { ticketId } = req.params;
    const { assigneeId } = req.body;

    if (!assigneeId) {
      return res.status(400).json({ message: "Assignee ID is required" });
    }

    const ticket = await supportTicketService.assignTicket(
      context,
      ticketId,
      assigneeId
    );

    res.status(200).json({
      message: "Ticket assigned successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({
      message: "Error assigning ticket",
      error: error.message,
    });
  }
};

/**
 * Update ticket status
 */
export const updateTicketStatus = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(TicketStatus).includes(status)) {
      return res.status(400).json({ message: "Valid status is required" });
    }

    const ticket = await supportTicketService.updateStatus(
      context,
      ticketId,
      status as TicketStatus
    );

    res.status(200).json({
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Error updating ticket status:", error);
    res.status(500).json({
      message: "Error updating ticket status",
      error: error.message,
    });
  }
};

/**
 * Get ticket statistics
 */
export const getStatistics = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);

    const stats = await supportTicketService.getStatistics(context);

    res.status(200).json({
      message: "Statistics fetched successfully",
      data: stats,
    });
  } catch (error: any) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};
