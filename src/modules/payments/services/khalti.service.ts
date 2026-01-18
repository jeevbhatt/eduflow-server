import axios from "axios";
import paymentSettingsService from "./paymentSettings.service";

class KhaltiService {
  private initiateUrl: string;

  constructor() {
    this.initiateUrl = "https://a.khalti.com/api/v2/epayment/initiate/";
  }

  private async getCredentials(instituteId?: string) {
    if (!instituteId) return process.env.KHALTI_SECRET_KEY || "";

    const meta = await paymentSettingsService.getDecryptedMetadata(instituteId, "khalti");

    if (meta && meta.secretKey) {
       return meta.secretKey;
    }
    return process.env.KHALTI_SECRET_KEY || "";
  }

  async initiatePayment(payload: {
    return_url: string;
    website_url: string;
    amount: number;
    purchase_order_id: string;
    purchase_order_name: string;
  }, instituteId?: string) { // Added instituteId param

    const secretKey = await this.getCredentials(instituteId);
    if (!secretKey) throw new Error("Khalti configuration missing");

    try {
      const response = await axios.post(
        this.initiateUrl,
        payload,
        {
          headers: {
            Authorization: `Key ${secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Khalti Initiation Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || "Khalti payment initiation failed");
    }
  }

  async verifyPayment(pidx: string, instituteId?: string) { // verify needs context too if keys differ
    const secretKey = await this.getCredentials(instituteId);

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  }
}

export default new KhaltiService();
