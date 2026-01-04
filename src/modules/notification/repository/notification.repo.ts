import { BaseRepository } from "@core/repository/BaseRepository";
import { Notification, NotificationType } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class NotificationRepo extends BaseRepository<Notification> {
  constructor() {
    super("notification");
  }

  async findByUser(userId: string, filters: any) {
    const { page = 1, limit = 20, isRead, type } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (typeof isRead === "boolean") where.isRead = isRead;
    if (type) where.type = type;

    return this.model.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
  }

  async markAsRead(ids: string[]) {
    return this.model.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    return this.model.count({
      where: { userId, isRead: false },
    });
  }
}

export default new NotificationRepo();
