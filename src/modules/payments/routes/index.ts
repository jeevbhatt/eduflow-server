import { Router } from "express";
import { createPaymentIntent, handleStripeWebhook } from "../controllers/stripe.controller";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controllers/khalti.controller";
import { initiateEsewaPayment, handleEsewaSuccess } from "../controllers/esewa.controller";
import { savePaymentConfig, getPaymentConfigs } from "../controllers/paymentSettings.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

// Stripe
router.post("/stripe/create-intent", authenticate, createPaymentIntent);
router.post("/stripe/webhook", handleStripeWebhook); // Webhook requires raw body usually

// Khalti
router.post("/khalti/initiate", authenticate, initiateKhaltiPayment);
router.post("/khalti/verify", authenticate, verifyKhaltiPayment);

// eSewa
router.post("/esewa/initiate", authenticate, initiateEsewaPayment);
router.get("/esewa/success", handleEsewaSuccess); // Public callback

// Configuration
router.post("/settings", authenticate, savePaymentConfig);
router.get("/settings", authenticate, getPaymentConfigs);

export default router;
