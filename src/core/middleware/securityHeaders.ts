import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

export const helmetConfig = helmet();

export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
};

export const getCsrfToken = (req: Request, res: Response) => {
  // Placeholder for CSRF logic
  res.json({ csrfToken: "dummy-token" });
};
