/**
 * Tenant Guard Middleware
 *
 * Ensures requests have proper institute context for multi-tenant isolation.
 * This provides application-level security that works with PgBouncer.
 */

import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    instituteId?: string;
    email: string;
  };
}

// Roles that can bypass institute requirement
const EXEMPT_ROLES = ["super_admin", "admin"];

/**
 * Middleware that requires a valid institute context.
 * Super admins and platform admins are exempt.
 */
export const requireInstitute = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Allow exempt roles to proceed without institute
  if (req.user?.role && EXEMPT_ROLES.includes(req.user.role)) {
    return next();
  }

  // Require institute for all other users
  if (!req.user?.instituteId) {
    return res.status(403).json({
      success: false,
      error: "Institute context required",
      code: "MISSING_INSTITUTE_CONTEXT",
      message: "This action requires an institute affiliation. Please join an institute first.",
    });
  }

  next();
};

/**
 * Extract institute ID from request with validation.
 * Returns null for exempt roles, throws for missing context.
 */
export const getInstituteId = (req: AuthenticatedRequest): string | null => {
  if (req.user?.role && EXEMPT_ROLES.includes(req.user.role)) {
    return null; // Exempt roles can access all institutes
  }

  if (!req.user?.instituteId) {
    throw new Error("Institute context required");
  }

  return req.user.instituteId;
};

/**
 * Check if user can access a specific institute's data.
 */
export const canAccessInstitute = (
  req: AuthenticatedRequest,
  targetInstituteId: string
): boolean => {
  // Exempt roles can access any institute
  if (req.user?.role && EXEMPT_ROLES.includes(req.user.role)) {
    return true;
  }

  // Users can only access their own institute
  return req.user?.instituteId === targetInstituteId;
};

export default requireInstitute;
