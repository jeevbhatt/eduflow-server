/**
 * API Security Service
 * Provides IDOR (Insecure Direct Object Reference) prevention,
 * ownership verification, and resource access control.
 *
 * SECURITY: Prevents unauthorized access to resources belonging to other users/institutes.
 */

import { Request, Response, NextFunction } from 'express';
import { IExtendedRequest } from '../middleware/type';
import sequelize from '../database/connection';
import { QueryTypes } from 'sequelize';
import crypto from 'crypto';
import { buildTableName } from './sqlSecurityService';

// ============================================
// ENCRYPTION FOR SENSITIVE DATA AT REST
// ============================================

// Use environment variable or generate a secure key
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY ||
  (process.env.NODE_ENV === 'production'
    ? (() => { throw new Error('DATA_ENCRYPTION_KEY must be set in production'); })()
    : 'development-key-32-characters!!'
  );

const IV_LENGTH = 16; // AES requires 16-byte IV
const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt sensitive data for storage at rest
 */
export const encryptData = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt data from storage
 */
export const decryptData = (encryptedData: string): string => {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[SECURITY] Decryption failed:', error);
    throw new Error('Data decryption failed');
  }
};

// ============================================
// OWNERSHIP VERIFICATION
// ============================================

type ResourceType = 'student' | 'teacher' | 'course' | 'category' | 'attendance' |
                    'assessment' | 'result' | 'fee_structure' | 'fee_payment' |
                    'library' | 'integration_credentials';

interface OwnershipConfig {
  table: string;
  idColumn?: string;
  ownerColumn?: string;
  instituteColumn?: string;
}

/**
 * Get table configuration for a resource type
 */
const getResourceConfig = (resourceType: ResourceType, instituteNumber: string): OwnershipConfig => {
  const configs: Record<ResourceType, OwnershipConfig> = {
    student: {
      table: buildTableName('student_', instituteNumber),
      idColumn: 'id',
    },
    teacher: {
      table: buildTableName('teacher_', instituteNumber),
      idColumn: 'id',
    },
    course: {
      table: buildTableName('course_', instituteNumber),
      idColumn: 'id',
    },
    category: {
      table: buildTableName('category_', instituteNumber),
      idColumn: 'id',
    },
    attendance: {
      table: buildTableName('attendance_', instituteNumber),
      idColumn: 'id',
    },
    assessment: {
      table: buildTableName('assessment_', instituteNumber),
      idColumn: 'id',
    },
    result: {
      table: buildTableName('result_', instituteNumber),
      idColumn: 'id',
    },
    fee_structure: {
      table: buildTableName('fee_structure_', instituteNumber),
      idColumn: 'id',
    },
    fee_payment: {
      table: buildTableName('fee_payment_', instituteNumber),
      idColumn: 'id',
    },
    library: {
      table: buildTableName('library_', instituteNumber),
      idColumn: 'id',
    },
    integration_credentials: {
      table: buildTableName('integration_credentials_', instituteNumber),
      idColumn: 'id',
      ownerColumn: 'userId',
    },
  };

  return configs[resourceType];
};

/**
 * Check if a resource exists and belongs to the current institute
 */
export const verifyResourceOwnership = async (
  resourceType: ResourceType,
  resourceId: string | number,
  instituteNumber: string
): Promise<boolean> => {
  try {
    const config = getResourceConfig(resourceType, instituteNumber);

    const result = await sequelize.query(
      `SELECT 1 FROM \`${config.table}\` WHERE ${config.idColumn || 'id'} = ? LIMIT 1`,
      {
        replacements: [resourceId],
        type: QueryTypes.SELECT,
      }
    );

    return result.length > 0;
  } catch (error) {
    console.error('[IDOR] Ownership verification failed:', error);
    return false;
  }
};

/**
 * Check if user owns a specific resource
 */
export const verifyUserOwnership = async (
  resourceType: ResourceType,
  resourceId: string | number,
  userId: string,
  instituteNumber: string
): Promise<boolean> => {
  try {
    const config = getResourceConfig(resourceType, instituteNumber);

    if (!config.ownerColumn) {
      // Resource doesn't have user ownership, just check institute
      return await verifyResourceOwnership(resourceType, resourceId, instituteNumber);
    }

    const result = await sequelize.query(
      `SELECT 1 FROM \`${config.table}\` WHERE ${config.idColumn || 'id'} = ? AND ${config.ownerColumn} = ? LIMIT 1`,
      {
        replacements: [resourceId, userId],
        type: QueryTypes.SELECT,
      }
    );

    return result.length > 0;
  } catch (error) {
    console.error('[IDOR] User ownership verification failed:', error);
    return false;
  }
};

// ============================================
// IDOR PREVENTION MIDDLEWARE
// ============================================

/**
 * Middleware to verify resource belongs to current institute
 * Use on routes like: GET /api/students/:id
 */
export const verifyInstituteResource = (resourceType: ResourceType, paramName: string = 'id') => {
  return async (req: IExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
    const resourceId = req.params[paramName];
    const instituteNumber = req.user?.currentInstituteNumber;

    if (!resourceId) {
      res.status(400).json({
        message: 'Resource ID required',
        code: 'MISSING_RESOURCE_ID'
      });
      return;
    }

    if (!instituteNumber) {
      res.status(403).json({
        message: 'Institute context required',
        code: 'NO_INSTITUTE_CONTEXT'
      });
      return;
    }

    const hasAccess = await verifyResourceOwnership(resourceType, resourceId, String(instituteNumber));

    if (!hasAccess) {
      // Log potential IDOR attempt
      console.warn(`[IDOR ALERT] User ${req.user?.id} attempted to access ${resourceType}:${resourceId} without permission`);

      res.status(404).json({
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to verify user owns the resource
 * Use on routes like: PUT /api/profile, DELETE /api/credentials/:id
 */
export const verifyUserResource = (resourceType: ResourceType, paramName: string = 'id') => {
  return async (req: IExtendedRequest, res: Response, next: NextFunction): Promise<void> => {
    const resourceId = req.params[paramName];
    const userId = req.user?.id;
    const instituteNumber = req.user?.currentInstituteNumber;

    if (!resourceId || !userId) {
      res.status(400).json({
        message: 'Resource ID and authentication required',
        code: 'MISSING_PARAMS'
      });
      return;
    }

    if (!instituteNumber) {
      res.status(403).json({
        message: 'Institute context required',
        code: 'NO_INSTITUTE_CONTEXT'
      });
      return;
    }

    const hasAccess = await verifyUserOwnership(resourceType, resourceId, userId, String(instituteNumber));

    if (!hasAccess) {
      console.warn(`[IDOR ALERT] User ${userId} attempted to access own ${resourceType}:${resourceId} without permission`);

      res.status(404).json({
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to ensure user can only access their own data
 * Compares :userId param with authenticated user
 */
export const verifySelfAccess = (paramName: string = 'userId') => {
  return (req: IExtendedRequest, res: Response, next: NextFunction): void => {
    const targetUserId = req.params[paramName];
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({
        message: 'Authentication required',
        code: 'UNAUTHENTICATED'
      });
      return;
    }

    // Allow if accessing own data OR if user is admin/super-admin
    const isAdmin = ['admin', 'super-admin'].includes(req.user?.role || '');

    if (targetUserId !== currentUserId && !isAdmin) {
      console.warn(`[IDOR ALERT] User ${currentUserId} attempted to access user ${targetUserId}'s data`);

      res.status(403).json({
        message: 'Access denied',
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
};

// ============================================
// MULTI-TENANT ISOLATION
// ============================================

/**
 * Middleware to ensure all requests are scoped to current institute
 */
export const enforceInstituteIsolation = (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  const instituteNumber = req.user?.currentInstituteNumber;

  // Skip for super-admin routes
  if (req.path.startsWith('/api/admin')) {
    next();
    return;
  }

  // Skip for auth routes (don't need institute context)
  if (req.path.startsWith('/api/auth')) {
    next();
    return;
  }

  // Skip for global routes
  if (req.path === '/health' || req.path === '/metrics') {
    next();
    return;
  }

  // Check for institute routes that require context
  if (req.path.startsWith('/api/institute') && !instituteNumber) {
    res.status(403).json({
      message: 'Institute context required',
      code: 'NO_INSTITUTE_CONTEXT'
    });
    return;
  }

  next();
};

// ============================================
// SAFE ID PARAMETER EXTRACTION
// ============================================

/**
 * Extract and validate ID from request params
 * Returns null if invalid, preventing injection
 */
export const safeGetId = (req: Request, paramName: string = 'id'): string | null => {
  const id = req.params[paramName];

  if (!id) return null;

  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Numeric format
  const numericRegex = /^\d+$/;

  if (uuidRegex.test(id) || numericRegex.test(id)) {
    return id;
  }

  console.warn(`[SECURITY] Invalid ID format attempted: ${id}`);
  return null;
};

/**
 * Middleware to validate ID parameters
 */
export const validateResourceId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validId = safeGetId(req, paramName);

    if (!validId) {
      res.status(400).json({
        message: 'Invalid resource identifier',
        code: 'INVALID_ID'
      });
      return;
    }

    next();
  };
};

// ============================================
// RATE LIMITING FOR SENSITIVE OPERATIONS
// ============================================

// Track sensitive operations per user
const sensitiveOpTracker = new Map<string, { count: number; resetAt: number }>();
const SENSITIVE_OP_LIMIT = 10;
const SENSITIVE_OP_WINDOW = 60 * 1000; // 1 minute

/**
 * Middleware to rate limit sensitive operations (delete, bulk update, export)
 */
export const rateLimitSensitiveOps = (operationType: string) => {
  return (req: IExtendedRequest, res: Response, next: NextFunction): void => {
    const userId = req.user?.id || 'anonymous';
    const key = `${userId}:${operationType}`;
    const now = Date.now();

    let tracker = sensitiveOpTracker.get(key);

    if (!tracker || tracker.resetAt < now) {
      tracker = { count: 0, resetAt: now + SENSITIVE_OP_WINDOW };
      sensitiveOpTracker.set(key, tracker);
    }

    tracker.count++;

    if (tracker.count > SENSITIVE_OP_LIMIT) {
      console.warn(`[RATE LIMIT] User ${userId} exceeded ${operationType} limit`);

      res.status(429).json({
        message: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((tracker.resetAt - now) / 1000)
      });
      return;
    }

    next();
  };
};

export default {
  encryptData,
  decryptData,
  verifyResourceOwnership,
  verifyUserOwnership,
  verifyInstituteResource,
  verifyUserResource,
  verifySelfAccess,
  enforceInstituteIsolation,
  safeGetId,
  validateResourceId,
  rateLimitSensitiveOps,
};
