import notificationRepo from "../repository/notification.repo";
import { NotificationType } from "@generated/prisma";

export class NotificationService {
  async getUserNotifications(userId: string, filters: any) {
    return notificationRepo.findByUser(userId, filters);
  }

  async markAsRead(userId: string, ids: string[]) {
    if (ids.length === 1 && ids[0] === "all") {
      const unread = await notificationRepo.findByUser(userId, { isRead: false, limit: 1000 });
      const unreadIds = unread.map((n: any) => n.id);
      if (unreadIds.length === 0) return { count: 0 };
      return notificationRepo.markAsRead(unreadIds);
    }
    return notificationRepo.markAsRead(ids);
  }

  async getUnreadCount(userId: string) {
    return notificationRepo.getUnreadCount(userId);
  }

  async createNotification(data: { userId: string; type: NotificationType; title: string; message: string; category?: string; link?: string; metadata?: any }) {
    return notificationRepo.create(data);
  }
}

export default new NotificationService();
