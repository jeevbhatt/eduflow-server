import { Router, Request, Response } from "express";

const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "success",
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
