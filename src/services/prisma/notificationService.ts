/**
 * Notification Service
 * Matches Prisma schema: Notification with NotificationType (success, info, warning, alert)
 */

import prisma from "../../database/prisma";
import {
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import { Notification, NotificationType } from "../../generated/prisma/client";

// DTO Types
interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  category?: string;
  link?: string;
  metadata?: Record<string, any>;
}

interface NotificationFilters {
  type?: NotificationType;
  category?: string;
  isRead?: boolean;
}

// ===========================================
// NOTIFICATION CRUD
// ===========================================

/**
 * Create a notification
 */
export async function createNotification(
  ctx: RLSContext,
  data: CreateNotificationDTO
): Promise<Notification> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        category: data.category,
        link: data.link,
        metadata: data.metadata,
      },
    });
  });
}

/**
 * Create multiple notifications (e.g., for bulk announcements)
 */
export async function createManyNotifications(
  ctx: RLSContext,
  notifications: CreateNotificationDTO[]
): Promise<{ count: number }> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        category: n.category,
        link: n.link,
        metadata: n.metadata,
      })),
    });
  });
}

/**
 * Get user's notifications with pagination and filters
 */
export async function getUserNotifications(
  ctx: RLSContext,
  filters: NotificationFilters = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Notification>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: ctx.userId,
    };

    if (filters.type) whereClause.type = filters.type;
    if (filters.category) whereClause.category = filters.category;
    if (typeof filters.isRead === "boolean")
      whereClause.isRead = filters.isRead;

    const [notifications, total] = await Promise.all([
      tx.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      tx.notification.count({ where: whereClause }),
    ]);

    return {
      data: notifications,
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
 * Get single notification
 */
export async function getNotification(
  ctx: RLSContext,
  notificationId: string
): Promise<Notification | null> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.findFirst({
      where: {
        id: notificationId,
        userId: ctx.userId,
      },
    });
  });
}

// ===========================================
// READ STATUS
// ===========================================

/**
 * Mark a notification as read
 */
export async function markAsRead(
  ctx: RLSContext,
  notificationId: string
): Promise<Notification> {
  return withRLSContext(ctx, async (tx) => {
    const notification = await tx.notification.findFirst({
      where: {
        id: notificationId,
        userId: ctx.userId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return tx.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  });
}

/**
 * Mark multiple notifications as read
 */
export async function markManyAsRead(
  ctx: RLSContext,
  notificationIds: string[]
): Promise<{ count: number }> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: ctx.userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  ctx: RLSContext
): Promise<{ count: number }> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.updateMany({
      where: {
        userId: ctx.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  });
}

// ===========================================
// DELETE
// ===========================================

/**
 * Delete a notification
 */
export async function deleteNotification(
  ctx: RLSContext,
  notificationId: string
): Promise<Notification> {
  return withRLSContext(ctx, async (tx) => {
    const notification = await tx.notification.findFirst({
      where: {
        id: notificationId,
        userId: ctx.userId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return tx.notification.delete({
      where: { id: notificationId },
    });
  });
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications(
  ctx: RLSContext
): Promise<{ count: number }> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.deleteMany({
      where: {
        userId: ctx.userId,
        isRead: true,
      },
    });
  });
}

// ===========================================
// COUNTS & STATS
// ===========================================

/**
 * Get unread notification count
 */
export async function getUnreadCount(ctx: RLSContext): Promise<number> {
  return withRLSContext(ctx, async (tx) => {
    return tx.notification.count({
      where: {
        userId: ctx.userId,
        isRead: false,
      },
    });
  });
}

/**
 * Get notification counts by category
 */
export async function getCountsByCategory(
  ctx: RLSContext
): Promise<{ category: string | null; count: number }[]> {
  return withRLSContext(ctx, async (tx) => {
    const counts = await tx.notification.groupBy({
      by: ["category"],
      where: {
        userId: ctx.userId,
        isRead: false,
      },
      _count: { id: true },
    });

    return counts.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));
  });
}

// ===========================================
// HELPER: SEND COMMON NOTIFICATIONS
// ===========================================

/**
 * Send assignment notification
 */
export async function sendAssignmentNotification(
  ctx: RLSContext,
  userId: string,
  assignmentTitle: string,
  link: string
): Promise<Notification> {
  return createNotification(ctx, {
    userId,
    type: NotificationType.info,
    title: "New Assignment",
    message: `You have a new assignment: ${assignmentTitle}`,
    category: "assignments",
    link,
  });
}

/**
 * Send grade notification
 */
export async function sendGradeNotification(
  ctx: RLSContext,
  userId: string,
  courseName: string,
  grade: string,
  link: string
): Promise<Notification> {
  return createNotification(ctx, {
    userId,
    type: NotificationType.success,
    title: "Grade Posted",
    message: `Your grade for ${courseName} has been posted: ${grade}`,
    category: "grades",
    link,
  });
}

/**
 * Send message notification
 */
export async function sendMessageNotification(
  ctx: RLSContext,
  userId: string,
  senderName: string,
  preview: string,
  link: string
): Promise<Notification> {
  return createNotification(ctx, {
    userId,
    type: NotificationType.info,
    title: "New Message",
    message: `${senderName}: ${preview.substring(0, 100)}${
      preview.length > 100 ? "..." : ""
    }`,
    category: "messages",
    link,
  });
}

/**
 * Send deadline reminder notification
 */
export async function sendDeadlineReminder(
  ctx: RLSContext,
  userId: string,
  itemTitle: string,
  dueDate: Date,
  link: string
): Promise<Notification> {
  return createNotification(ctx, {
    userId,
    type: NotificationType.warning,
    title: "Deadline Reminder",
    message: `${itemTitle} is due on ${dueDate.toLocaleDateString()}`,
    category: "deadlines",
    link,
  });
}

/**
 * Send system alert notification
 */
export async function sendSystemAlert(
  ctx: RLSContext,
  userId: string,
  title: string,
  message: string
): Promise<Notification> {
  return createNotification(ctx, {
    userId,
    type: NotificationType.alert,
    title,
    message,
    category: "system",
  });
}

// Export all functions as a service object
export const notificationService = {
  createNotification,
  createManyNotifications,
  getUserNotifications,
  getNotification,
  markAsRead,
  markManyAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount,
  getCountsByCategory,
  sendAssignmentNotification,
  sendGradeNotification,
  sendMessageNotification,
  sendDeadlineReminder,
  sendSystemAlert,
};
