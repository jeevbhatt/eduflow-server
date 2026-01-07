import { Request, Response } from "express";
import stripeService from "../services/stripe.service";
import prisma from "../../../core/database/prisma";

export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency, metadata, instituteId } = req.body; // Allow passing instituteId explicitly or from context

    if (!amount) {
      return res.status(400).json({ status: "error", message: "Amount required" });
    }

    // Prefer context instituteId if available (authenticated request)
    const targetInstituteId = (req as any).instituteId || instituteId;

    const intent = await stripeService.createPaymentIntent(amount, currency, metadata, targetInstituteId);

    res.json({
      clientSecret: intent.client_secret,
      id: intent.id,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  try {
    if (!sig) throw new Error("No signature");

    // Use rawBody if available (needs raw body parser middleware for this route)
    const event = await stripeService.constructEvent(req.body, sig as string);

    // Handle event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
      // Update DB logic here (Update StudentPayment, FeePayment status)
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
