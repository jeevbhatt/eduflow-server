import helmet from "helmet";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export const helmetConfig = helmet();

export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
};

export const getCsrfToken = (req: Request, res: Response) => {
  // Generate a secure CSRF token
  const csrfToken = crypto.randomUUID();

  // Store in cookie for validation
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("_csrf", csrfToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    domain: isProduction ? ".eduflow.jeevanbhatt.com.np" : undefined,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  res.json({ csrfToken });
};
