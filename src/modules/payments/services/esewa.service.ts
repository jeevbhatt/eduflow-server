
import crypto from "crypto";
import prisma from "../../../core/database/prisma";

class EsewaService {
  private gatewayUrl: string;

  constructor() {
    // Check Env for production URL
    this.gatewayUrl = process.env.NODE_ENV === "production"
      ? "https://epay.esewa.com.np/api/epay/main/v2/form"
      : "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
  }

  private async getCredentials(instituteId?: string) {
    if (!instituteId) {
      return {
        merchantId: process.env.ESEWA_MERCHANT_ID || "EPAYTEST",
        secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
      };
    }

    const integration = await prisma.instituteIntegration.findUnique({
      where: { instituteId_provider: { instituteId, provider: "esewa" } },
    });

    if (integration && integration.isActive && integration.metadata) {
      const meta = integration.metadata as any;
      return {
        merchantId: meta.merchantCode || meta.merchantId || process.env.ESEWA_MERCHANT_ID || "EPAYTEST", // handle variations
        secretKey: meta.secretKey || process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
      };
    }

    return {
      merchantId: process.env.ESEWA_MERCHANT_ID || "EPAYTEST",
      secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
    };
  }

  generateSignature(totalAmount: string, transactionUuid: string, productCode: string, secretKey: string) {
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(message);
    return hmac.digest("base64");
  }

  async getPaymentConfig(amount: number, transactionUuid: string, successUrl: string, failureUrl: string, instituteId?: string) {
    const creds = await this.getCredentials(instituteId);
    const totalAmount = amount.toString();
    const signature = this.generateSignature(totalAmount, transactionUuid, creds.merchantId, creds.secretKey);

    return {
      amount: totalAmount,
      failure_url: failureUrl,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: creds.merchantId,
      signature: signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: successUrl,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      url: this.gatewayUrl,
    };
  }

  verifySignature(encodedData: string) {
      // Logic to decode and verify signature if needed on callback
      // Usually eSewa callbacks are simple GET with params, or POST with decoded payload
      // For basic EPAY v2, verification happens by checking the status API or signature re-generation
      return true;
  }
}

export default new EsewaService();
