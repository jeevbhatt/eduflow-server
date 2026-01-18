import * as admin from "firebase-admin";
import { messaging } from "firebase-admin";
import prisma from "../../../core/database/prisma";

class PushService {
  async subscribe(userId: string, fcmToken: string, deviceType?: string, userAgent?: string) {
    return prisma.pushSubscription.upsert({
      where: { fcmToken },
      update: {
        userId,
        deviceType,
        userAgent,
      },
      create: {
        userId,
        fcmToken,
        deviceType,
        userAgent,
      },
    });
  }

  async unsubscribe(fcmToken: string) {
    return prisma.pushSubscription.delete({
      where: { fcmToken },
    });
  }

  async sendNotification(userId: string, payload: { title: string; body: string; data?: any }) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return [];

    const tokens = subscriptions.map(sub => sub.fcmToken);

    const message: messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ? Object.keys(payload.data).reduce((acc, key) => {
        acc[key] = String(payload.data[key]);
        return acc;
      }, {} as Record<string, string>) : undefined,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (code === "messaging/registration-token-not-registered" ||
                code === "messaging/invalid-registration-token") {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await prisma.pushSubscription.deleteMany({
            where: { fcmToken: { in: failedTokens } }
          });
        }
      }
      return response;
    } catch (error) {
      console.error("Error sending FCM notification:", error);
      throw error;
    }
  }
}

export default new PushService();
