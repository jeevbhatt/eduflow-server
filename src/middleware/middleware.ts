import { NextFunction, Response } from "express";
import {
  verifyAccessToken,
  TokenPayload,
} from "../services/secureTokenService";
import User from "../database/models/userModel";
import { IExtendedRequest, UserRole } from "./type";

/**
 * Middleware to check if user is logged in
 * Uses secure token service with full JWT validation
 */
const isLoggedIn = async (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message: "Authorization token required",
        code: "NO_TOKEN",
      });
      return;
    }

    // Support both "Bearer <token>" and plain token formats
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token === "null" || token === "undefined") {
      res.status(401).json({
        message: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT",
      });
      return;
    }

    // Verify token using secure service (includes issuer, audience, blacklist check)
    const payload = await verifyAccessToken(token);

    // Fetch user from database to ensure they still exist and are not suspended
    const userData = await User.findByPk(payload.id, {
      attributes: ["id", "currentInstituteNumber", "role", "accountStatus"],
    });

    if (!userData) {
      res.status(403).json({
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    // Check account status
    if (userData.accountStatus === "suspended") {
      res.status(403).json({
        message: "Account suspended",
        code: "ACCOUNT_SUSPENDED",
      });
      return;
    }

    if (userData.accountStatus === "inactive") {
      res.status(403).json({
        message: "Account inactive",
        code: "ACCOUNT_INACTIVE",
      });
      return;
    }

    req.user = {
      id: userData.id,
      currentInstituteNumber: userData.currentInstituteNumber,
      role: userData.role as UserRole,
    };
    next();
  } catch (error: any) {
    // Different error messages for different failure modes
    if (error.message.includes("expired")) {
      res.status(401).json({
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    } else if (
      error.message.includes("revoked") ||
      error.message.includes("blacklisted")
    ) {
      res.status(401).json({
        message: "Token has been revoked",
        code: "TOKEN_REVOKED",
      });
    } else {
      res.status(403).json({
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }
  }
};

/**
 * Middleware to modify user ID for dynamic table names
 * Replaces hyphens with underscores for SQL compatibility
 * SECURITY: Validates ID format to prevent injection
 */
const changeUserIdForTableName = (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.id) {
    // Validate UUID format (security check)
    const uuidRegex =
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (!uuidRegex.test(req.user.id)) {
      res.status(400).json({
        message: "Invalid user identifier format",
        code: "INVALID_USER_ID",
      });
      return;
    }

    const newUserId = req.user.id.split("-").join("_");
    req.user = { ...req.user, id: newUserId };
    next();
  } else {
    res.status(400).json({
      message: "User information not available",
      code: "NO_USER_INFO",
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param roles - Array of allowed roles
 */
const restrictTo = (...roles: UserRole[]) => {
  return (req: IExtendedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as UserRole;

    if (!userRole) {
      res.status(403).json({
        message: "Access denied",
        code: "NO_ROLE",
      });
      return;
    }

    if (roles.includes(userRole)) {
      next();
    } else {
      res.status(403).json({
        message: "You do not have permission to access this resource",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }
  };
};

/**
 * Optional auth middleware - doesn't fail if no token, just sets user if present
 */
const optionalAuth = async (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token || token === "null" || token === "undefined") {
      next();
      return;
    }

    const payload = await verifyAccessToken(token);
    const userData = await User.findByPk(payload.id, {
      attributes: ["id", "currentInstituteNumber", "role"],
    });

    if (userData) {
      req.user = {
        id: userData.id,
        currentInstituteNumber: userData.currentInstituteNumber,
        role: userData.role as UserRole,
      };
    }

    next();
  } catch {
    // Silently continue without user context
    next();
  }
};

// Alias for clarity in v2 routes
const requireRole = restrictTo;

export {
  isLoggedIn,
  restrictTo,
  changeUserIdForTableName,
  optionalAuth,
  requireRole,
};
