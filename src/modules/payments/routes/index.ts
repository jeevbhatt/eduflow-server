import { Router } from "express";
import { createPaymentIntent, handleStripeWebhook } from "../controllers/stripe.controller";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controllers/khalti.controller";
import { initiateEsewaPayment, handleEsewaSuccess } from "../controllers/esewa.controller";
import { savePaymentConfig, getPaymentConfigs } from "../controllers/paymentSettings.controller";
import { authenticate } from "../../../core/middleware/authenticate";
import { paymentLimiter } from "../../../core/middleware/rateLimiter";

const router = Router();

// Stripe
router.post("/stripe/create-intent", authenticate, paymentLimiter, createPaymentIntent);
router.post("/stripe/webhook/:instituteId", handleStripeWebhook); // Unique per-institute webhook

// Khalti
router.post("/khalti/initiate", authenticate, paymentLimiter, initiateKhaltiPayment);
router.post("/khalti/verify", authenticate, verifyKhaltiPayment);

// eSewa
router.post("/esewa/initiate", authenticate, paymentLimiter, initiateEsewaPayment);
router.get("/esewa/success", handleEsewaSuccess);

// Global IME
import { initiateGlobalImePayment, handleGlobalImeCallback } from "../controllers/globalIme.controller";
router.post("/global-ime/initiate", authenticate, paymentLimiter, initiateGlobalImePayment);
router.post("/global-ime/callback", handleGlobalImeCallback);

// Configuration
router.post("/settings", authenticate, savePaymentConfig);
router.get("/settings", authenticate, getPaymentConfigs);

export default router;
