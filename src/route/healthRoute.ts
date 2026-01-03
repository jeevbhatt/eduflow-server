import { Router, Request, Response } from "express";
import prisma from "../database/prisma";

const router = Router();

/**
 * Health check endpoint
 * Used by load balancers and monitoring systems
 */
router.get("/health", async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Check Prisma/PostgreSQL connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      database: "Prisma + Supabase PostgreSQL",
      checks: {
        database: {
          status: "connected",
          latency: `${dbLatency}ms`,
        },
      },
      memory: {
        heapUsed: `${Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024
        )}MB`,
        heapTotal: `${Math.round(
          process.memoryUsage().heapTotal / 1024 / 1024
        )}MB`,
      },
    });
  } catch (error: any) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: "disconnected",
          error: error.message,
        },
      },
    });
  }
});

/**
 * Readiness check endpoint
 * Returns 200 when application is ready to receive traffic
 */
router.get("/ready", (req: Request, res: Response) => {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness check endpoint
 * Simple check that the process is alive
 */
router.get("/live", (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    pid: process.pid,
  });
});

export default router;
