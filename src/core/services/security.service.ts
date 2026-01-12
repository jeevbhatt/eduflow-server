import sendMail from "./sendMail";
import { securityAlertEmail } from "./email-templates";

const SUPER_ADMIN_EMAIL = "codingwithjiwan@gmail.com";

export class SecurityService {
  /**
   * Notify super-admin about high-risk security events
   * Uses a dedicated professional template to avoid spam filters
   */
  static async notifyAdmin(data: {
    trigger: string;
    ip: string;
    userAgent?: string;
    details?: string;
  }) {
    try {
      const emailContent = securityAlertEmail({
        ...data,
        timestamp: new Date().toISOString(),
      });

      await sendMail({
        to: SUPER_ADMIN_EMAIL,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log(`[SECURITY ALERT] Admin notified for: ${data.trigger} from IP: ${data.ip}`);
    } catch (error) {
      console.error("Failed to send security alert to admin:", error);
    }
  }

  /**
   * Log security events (can be expanded to DB/External logging)
   */
  static logEvent(event: string, details: any) {
    console.warn(`[SECURITY EVENT] ${event}:`, JSON.stringify(details, null, 2));
  }
}

export default SecurityService;
