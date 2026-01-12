import { Request, Response, NextFunction } from "express";
import SecurityService from "../services/security.service";

/**
 * Honeypot Middleware
 * Detects and blocks automated AI/Bot scanners targeting common vulnerabilities
 */
export const honeypotTrap = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || "unknown";
  const path = req.originalUrl;
  const userAgent = req.get("User-Agent");

  // Define highly suspicious paths that are never part of EduFlow
  const traps = [
    "/wp-admin",
    "/wp-login.php",
    "/.env",
    "/config.php",
    "/admin.php",
    "/xmlrpc.php",
    "/backup.zip",
    "/.git",
    "/shell.php",
    "/phpmyadmin"
  ];

  const isTrapUsed = traps.some(trap => path.toLowerCase().includes(trap));

  if (isTrapUsed) {
    // Immediate action: Notify Admin and block request
    await SecurityService.notifyAdmin({
      trigger: `AI Honeypot Hit: ${path}`,
      ip,
      userAgent,
      details: `The attacker attempted to access a known trap route: ${path}.\nThis IP should be considered highly malicious.`,
    });

    SecurityService.logEvent("HONEYPOT_HIT", { ip, path, userAgent });

    // Respond with a silent 404 or a long delay to waste attacker's time
    return res.status(404).json({
      status: "error",
      message: "Not Found"
    });
  }

  next();
};
