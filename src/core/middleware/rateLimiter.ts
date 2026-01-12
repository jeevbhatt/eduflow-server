import rateLimit from "express-rate-limit";
import SecurityService from "../services/security.service";

/**
 * Standard API Limiter - Prevents general resource exhaustion
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: "error",
    message: "Too many requests from this IP, please try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth Limiter - Prevents brute force login attempts
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 attempts
  message: {
    status: "error",
    message: "Too many login attempts, please try again after an hour"
  },
  handler: async (req, res, next, options) => {
    // Notify admin for potential brute force
    await SecurityService.notifyAdmin({
      trigger: "Possible Brute Force Attack",
      ip: req.ip || "unknown",
      userAgent: req.get("User-Agent"),
      details: `Targeted Email: ${req.body?.email || "Unknown"}\nEndpoint: ${req.originalUrl}`,
    });

    res.status(options.statusCode).send(options.message);
  }
});

/**
 * Registration Limiter - Prevents signup spam
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations
  message: {
    status: "error",
    message: "Too many accounts created from this IP. Please try again after an hour."
  },
});

/**
 * Email Resend Limiter - Protects mail quota
 */
export const emailResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 resends
  message: {
    status: "error",
    message: "Too many verification requests. Please check your inbox or try again later."
  },
});

/**
 * Payment Limiter - Prevents card testing
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: {
    status: "error",
    message: "Too many payment attempts. Please try again later for security."
  },
  handler: async (req, res, next, options) => {
    if (res.statusCode === 429) {
      await SecurityService.notifyAdmin({
        trigger: "Possible Card Testing Flow",
        ip: req.ip || "unknown",
        userAgent: req.get("User-Agent"),
        details: `Endpoint: ${req.originalUrl}\nMethod: ${req.method}`,
      });
    }
    res.status(options.statusCode).send(options.message);
  }
});
