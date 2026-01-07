import axios from "axios";
import prisma from "../../../core/database/prisma";

class KhaltiService {
  private initiateUrl: string;

  constructor() {
    this.initiateUrl = "https://a.khalti.com/api/v2/epayment/initiate/";
  }

  private async getCredentials(instituteId?: string) {
    if (!instituteId) return process.env.KHALTI_SECRET_KEY || "";

    const integration = await prisma.instituteIntegration.findUnique({
      where: { instituteId_provider: { instituteId, provider: "khalti" } },
    });

    if (integration && integration.isActive && integration.metadata) {
       return (integration.metadata as any).secretKey || process.env.KHALTI_SECRET_KEY || "";
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
