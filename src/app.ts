import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import envConfigService from "@core/services/envConfigService";

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
import healthRoute from "@core/routes/health.route";

// Validate Environment
envConfigService.validateEnvOrExit();

const app = express();

// ============================================
// PROXY TRUST (REQUIRED FOR Render/Heroku/etc)
// ============================================
// Trust the first proxy (Render/Heroku load balancer)
// This fixes the "X-Forwarded-For header is set but trust proxy is false" error
app.set("trust proxy", 1);

// ============================================
// SECURITY & PERSISTENCE (CORE)
// ============================================
app.use(helmetConfig);
app.use(additionalSecurityHeaders);
app.use(cookieParser());
app.use(express.json({
  limit: "10mb",
  verify: (req: any, _res, buf) => {
    if (req.originalUrl?.includes("/webhook")) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitization
app.use(sanitizeBody);
app.use(sanitizeQuery);

// Dynamic CORS origin validator for subdomain support
const allowedOriginPatterns = [
  /^http:\/\/localhost:(3000|3001|3002|3003|4000)$/,
  /^https?:\/\/(www\.)?eduflow\.jeevanbhatt\.com\.np$/,
  /^https?:\/\/(student|teacher|super-admin|admin)\.eduflow\.jeevanbhatt\.com\.np$/,
  /^https?:\/\/[a-z0-9-]+\.eduflow\.jeevanbhatt\.com\.np$/, // Institute subdomains
];

const corsOriginValidator = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Allow requests with no origin (like mobile apps or curl)
  if (!origin) {
    return callback(null, true);
  }

  // Check against allowed patterns
  const isAllowed = allowedOriginPatterns.some(pattern => pattern.test(origin));

  if (isAllowed) {
    callback(null, true);
  } else {
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'), false);
  }
};

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
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
