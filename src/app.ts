import express from "express";
import cors from "cors";
import * as Sentry from "@sentry/node";

// Import routes
import authRoute from "./route/globals/auth/authRoute";
import instituteRoute from "./route/institute/instituteRoute";
import courseRoute from "./route/institute/course/courseRoute";
import studentRoute from "./route/institute/student/studentRoute";
import categoryRoute from "./route/institute/category/categoryRoute";
import teacherInstituteRoute from "./route/institute/teacher/teacherRoute";
import teacherRoute from "./route/teacher/teacherRoute";
import lessonRoute from "./route/teacher/course/lessons/course-lesson";
import chapterRoute from "./route/teacher/course/chapters/course-chapter-router";
import studentInstituteRoute from "./route/student/institute/student-institute.route";
import studentCartRoute from "./route/student/cart/student-cart.route";
import studentCourseOrderRoute from "./route/student/order/student-order.route";
import academicRoute from "./route/institute/academic/academicRoute";
import financeRoute from "./route/institute/finance/financeRoute";
import securityRoute from "./route/globals/security/securityRoute";
import libraryRoute from "./route/institute/library/libraryRoute";
import sheetsRoute from "./route/integration/sheetsRoute";
import healthRoute from "./route/healthRoute";
import adminRoute from "./route/super-admin/adminRoute";

// Import v2 routes (Prisma-based)
import {
  forumRoute,
  studyGroupRoute,
  supportRoute,
  progressRoute,
  paymentRoute,
  libraryRoute as libraryV2Route,
  experimentRoute,
} from "./route/v2";

// Import middleware
import { tenantMiddleware } from "./middleware/tenantMiddleware";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import globalErrorHandler from "./middleware/globalErrorHandler";
import { validateInstituteMiddleware } from "./services/sqlSecurityService";
import {
  helmetConfig,
  additionalSecurityHeaders,
  getCsrfToken,
  sanitizeErrorResponse,
} from "./middleware/securityHeaders";
import cookieParser from "cookie-parser";

const app = express();

// ============================================
// SECURITY HEADERS (MUST BE FIRST)
// ============================================
app.use(helmetConfig);
app.use(additionalSecurityHeaders);

// ============================================
// CORE MIDDLEWARE
// ============================================
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global XSS sanitization (after body parsing)
import { sanitizeBody, sanitizeQuery } from "./services/validationService";
app.use(sanitizeBody);
app.use(sanitizeQuery);

// CORS configuration
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

// Rate limiting (after CORS, before routes)
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Multi-tenant middleware
app.use(tenantMiddleware);

// ============================================
// HEALTH & STATUS ROUTES (No auth required)
// ============================================
app.use("/", healthRoute);

// CSRF Token endpoint (for cookie-based auth flows)
app.get("/api/csrf-token", getCsrfToken);

// ============================================
// API ROUTES
// ============================================

// Global routes
app.use("/api/auth", authRoute);
app.use("/api/security", securityRoute);

// Institute routes
app.use("/api/institute", instituteRoute);
app.use("/api/institute/course", courseRoute);
app.use("/api/institute/student", studentRoute);
app.use("/api/institute/category", categoryRoute);
app.use("/api/institute/teacher", teacherInstituteRoute);
app.use("/api/institute/academic", academicRoute);
app.use("/api/institute/finance", financeRoute);
app.use("/api/institute/library", libraryRoute);

// Integration routes
app.use("/api/integration/sheets", sheetsRoute);

// Teacher routes
app.use("/api/teacher", teacherRoute);
app.use("/api/teacher/course", chapterRoute);
app.use("/api/teacher/course", lessonRoute);

// Student routes
app.use("/api/student", studentInstituteRoute);
app.use("/api/student/", studentCartRoute);
app.use("/api/student", studentCourseOrderRoute);

// Super-Admin routes
app.use("/api/admin", adminRoute);

// ============================================
// V2 API ROUTES (Prisma-based, RLS-enabled)
// ============================================
app.use("/api/v2/forum", forumRoute);
app.use("/api/v2/study-groups", studyGroupRoute);
app.use("/api/v2/support", supportRoute);
app.use("/api/v2/progress", progressRoute);
app.use("/api/v2/payments", paymentRoute);
app.use("/api/v2/library", libraryV2Route);
app.use("/api/v2/experiments", experimentRoute);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
  });
});

// ============================================
// ERROR HANDLERS (MUST BE LAST)
// ============================================
// Setup Sentry error handler for Express (newer API)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(globalErrorHandler);

export default app;
