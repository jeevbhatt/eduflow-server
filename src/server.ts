import dotenv from "dotenv";
dotenv.config();

// Validate environment configuration FIRST
import { validateEnvOrExit } from "./services/envConfigService";
const validatedEnv = validateEnvOrExit();

// Initialize Sentry SECOND (if configured)
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "your-sentry-dsn") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"
    ),
    beforeSend(event) {
      // Don't send events in development unless explicitly enabled
      if (
        process.env.NODE_ENV === "development" &&
        !process.env.SENTRY_ENABLE_DEV
      ) {
        return null;
      }
      return event;
    },
  });
  console.log("✅ Sentry error tracking initialized");
}

import app from "./app";
import { envConfig } from "./config/config";
import analytics from "./services/analytics";
import schedulerService from "./services/schedulerService";

// Initialize PostHog analytics
analytics.init();

// Initialize scheduler for background jobs
schedulerService.initScheduler();

// Uncaught exception handler
process.on("uncaughtException", (error: Error) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...");
  console.error("Error:", error.name, error.message);
  console.error("Stack:", error.stack);

  // Capture to Sentry
  Sentry.captureException(error, { level: "fatal" });

  // Give Sentry time to send the event
  setTimeout(() => {
    process.exit(1);
  }, 2000);
});

// Unhandled promise rejection handler
process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("💥 UNHANDLED REJECTION! Shutting down...");
    console.error("Reason:", reason);

    // Capture to Sentry
    Sentry.captureException(reason, { level: "fatal" });

    // Give Sentry time to send the event
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  }
);

// Start server
const PORT = envConfig.portNumber;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log("✅ HTTP server closed");

    // Shutdown analytics
    await analytics.shutdown();
    console.log("✅ Analytics shutdown complete");

    // Close Sentry
    await Sentry.close(2000);
    console.log("✅ Sentry closed");

    console.log("✅ Graceful shutdown complete");
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { server, Sentry };
