import Stripe from "stripe";
import prisma from "../../../core/database/prisma";

class StripeService {
  private getClient(apiKey: string) {
    return new Stripe(apiKey, {
      // apiVersion: "2024-12-18.acacia", // Removed to use default or avoid mismatch
    });
  }

  private async getInstituteCredentials(instituteId?: string) {
    if (!instituteId) return process.env.STRIPE_SECRET_KEY || "";

    const integration = await prisma.instituteIntegration.findUnique({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "stripe",
        },
      },
    });

    if (integration && integration.isActive && integration.metadata) {
      const meta = integration.metadata as any;
      return meta.secretKey || process.env.STRIPE_SECRET_KEY || "";
    }

    return process.env.STRIPE_SECRET_KEY || "";
  }

  async createPaymentIntent(amount: number, currency: string = "usd", metadata: any = {}, instituteId?: string) {
    const secretKey = await this.getInstituteCredentials(instituteId);

    if (!secretKey) throw new Error("Stripe configuration missing for this institute");

    const stripe = this.getClient(secretKey);

    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async constructEvent(payload: string | Buffer, signature: string, instituteId?: string) {
     // Webhook handling is trickier for multi-tenant if using different endpoints.
     // For now, assuming centralization or platform connect.
     // A simpler approach for single-endpoint webhooks is using the Platform's webhook secret
     // But verifying events meant for connected accounts requires more logic.
     // Falling back to env secret for now as webhooks usually hit one server endpoint.
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("Stripe webhook secret missing");
    }
    // Note: If institutes bring their own keys, they need their own webhooks or we act as platform.
    // For simplicity in this iteration, we verify using system secret (assuming Connect or shared).
    const stripe = this.getClient(process.env.STRIPE_SECRET_KEY || "");
    return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  }
}

export default new StripeService();
