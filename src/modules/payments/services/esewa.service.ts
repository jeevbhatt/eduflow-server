import crypto from "crypto";
import paymentSettingsService from "./paymentSettings.service";

class EsewaService {
  private gatewayUrl: string;

  constructor() {
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

    const meta = await paymentSettingsService.getDecryptedMetadata(instituteId, "esewa");

    if (meta) {
      return {
        merchantId: meta.merchantCode || meta.merchantId || process.env.ESEWA_MERCHANT_ID || "EPAYTEST",
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

  verifySignature(encodedData: string, secretKey: string) {
    try {
      const decoded = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
      const { total_amount, transaction_uuid, product_code, signature } = decoded;

      const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
      const hmac = crypto.createHmac("sha256", secretKey);
      hmac.update(message);
      const expectedSignature = hmac.digest("base64");

      return expectedSignature === signature;
    } catch (error) {
      console.error("eSewa Signature Verification Error:", error);
      return false;
    }
  }

  async checkStatus(transactionUuid: string, amount: number, instituteId?: string) {
    const creds = await this.getCredentials(instituteId);
    const url = process.env.NODE_ENV === "production"
      ? `https://epay.esewa.com.np/api/epay/main/v2/lookup?product_code=${creds.merchantId}&total_amount=${amount}&transaction_uuid=${transactionUuid}`
      : `https://rc-epay.esewa.com.np/api/epay/main/v2/lookup?product_code=${creds.merchantId}&total_amount=${amount}&transaction_uuid=${transactionUuid}`;

    // Note: status check should be handled in the controller calling this service
    return url;
  }
}

export default new EsewaService();
