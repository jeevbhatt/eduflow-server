import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";

// Core Infrastructure
import { tenantMiddleware } from "@core/middleware/tenantMiddleware";
import { apiLimiter, authLimiter } from "@core/middleware/rateLimiter";
import globalErrorHandler from "@core/middleware/globalErrorHandler";
import {
  helmetConfig,
  additionalSecurityHeaders,
  getCsrfToken
} from "@core/middleware/securityHeaders";
import { sanitizeBody, sanitizeQuery } from "@core/services/validationService";

// Modular Routes
import modularRouter from "@modules/index";
import healthRoute from "./route/healthRoute";

const app = express();

// ============================================
// SECURITY & PERSISTENCE (CORE)
// ============================================
app.use(helmetConfig);
app.use(additionalSecurityHeaders);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitization
app.use(sanitizeBody);
app.use(sanitizeQuery);

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ============================================
// MULTI-TENANCY & RATE LIMITING
// ============================================
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use(tenantMiddleware);

// ============================================
// API ROUTES
// ============================================

// Modularized Features
app.use("/api", modularRouter);

// System Routes
app.use("/", healthRoute);
app.get("/api/csrf-token", getCsrfToken);

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
  });
});

if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(globalErrorHandler);

export default app;
