/**
 * SMS Service Placeholder for Nepal-specific gateways.
 *
 * Recommended Gateways:
 * 1. Sparrow SMS (https://sparrowsms.com/)
 * 2. Aakash SMS (https://aakashsms.com/)
 */

import axios from "axios";

class SmsService {
  private apiUrl: string;
  private token: string;

  constructor() {
    this.apiUrl = process.env.SMS_GATEWAY_URL || "";
    this.token = process.env.SMS_GATEWAY_TOKEN || "";
  }

  /**
   * Send SMS via local gateway.
   * Note: This usually requires a paid plan and a registered "Identity" (Sender ID).
   */
  async sendSMS(to: string, message: string) {
    if (!this.apiUrl || !this.token) {
      console.warn("SMS Gateway not configured. Mocking SMS send to:", to);
      return { success: true, message: "Mock SMS sent" };
    }

    try {
      const response = await axios.post(this.apiUrl, {
        token: this.token,
        to: to,
        text: message,
      });
      return response.data;
    } catch (error) {
      console.error("SMS Gateway Error:", error);
      throw new Error("Failed to send SMS via local gateway");
    }
  }

  /**
   * Pre-defined template for Student Absence
   */
  async sendAbsenceAlert(to: string, studentName: string, date: string) {
    const msg = `Dear Parent, ${studentName} was marked ABSENT today (${date}) at EduFlow. Please contact us if unplanned.`;
    return this.sendSMS(to, msg);
  }
}

export default new SmsService();
