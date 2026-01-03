/**
 * SQL Security Utilities
 * Provides protection against SQL injection attacks, especially for
 * dynamic table names used in multi-tenant architecture.
 *
 * SECURITY CRITICAL: All dynamic SQL identifiers must pass through these functions.
 */

// ============================================
// ALLOWED PATTERNS
// ============================================

// Only alphanumeric and underscores allowed in table names
const SAFE_TABLE_NAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

// Institute number can be UUID (without hyphens) or numeric
const SAFE_INSTITUTE_NUMBER_REGEX = /^[a-f0-9]{32}$|^[0-9]+$|^[a-zA-Z0-9_]+$/i;

// Valid table prefixes in the system
const VALID_TABLE_PREFIXES = [
  'student_',
  'teacher_',
  'course_',
  'category_',
  'institute_',
  'fee_structure_',
  'fee_payment_',
  'attendance_',
  'assessment_',
  'result_',
  'exam_schedule_',
  'library_',
  'library_borrow_',
  'course_chapter_',
  'chapter_lesson_',
  'integration_credentials_',
  'student_cart_',
  'student_order_',
  'student_order_details_',
  'student_payment_',
  'security_logs_',
] as const;

// Maximum length for table names (MySQL limit is 64)
const MAX_TABLE_NAME_LENGTH = 64;
const MAX_INSTITUTE_NUMBER_LENGTH = 50;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates that a string is safe to use as an SQL identifier
 * @throws Error if the string contains unsafe characters
 */
export const validateSqlIdentifier = (value: string, fieldName: string = 'identifier'): void => {
  if (!value || typeof value !== 'string') {
    throw new Error(`Invalid ${fieldName}: must be a non-empty string`);
  }

  if (value.length > MAX_TABLE_NAME_LENGTH) {
    throw new Error(`Invalid ${fieldName}: exceeds maximum length of ${MAX_TABLE_NAME_LENGTH}`);
  }

  if (!SAFE_TABLE_NAME_REGEX.test(value)) {
    throw new Error(`Invalid ${fieldName}: contains unsafe characters`);
  }
};

/**
 * Validates institute number format
 * Institute numbers should be UUIDs (without hyphens), numeric IDs, or alphanumeric strings
 */
export const validateInstituteNumber = (instituteNumber: string | number | null | undefined): string => {
  if (instituteNumber === null || instituteNumber === undefined) {
    throw new Error('Institute number is required');
  }

  const normalized = String(instituteNumber).trim();

  if (!normalized) {
    throw new Error('Institute number cannot be empty');
  }

  if (normalized.length > MAX_INSTITUTE_NUMBER_LENGTH) {
    throw new Error(`Institute number exceeds maximum length of ${MAX_INSTITUTE_NUMBER_LENGTH}`);
  }

  // Check for SQL injection patterns
  const dangerousPatterns = [
    /;/,           // Statement terminator
    /--/,          // Comment
    /\/\*/,        // Block comment start
    /\*\//,        // Block comment end
    /'/,           // Single quote
    /"/,           // Double quote
    /`/,           // Backtick
    /\\/,          // Backslash
    /\x00/,        // Null byte
    /drop\s+/i,    // DROP
    /delete\s+/i,  // DELETE
    /insert\s+/i,  // INSERT
    /update\s+/i,  // UPDATE
    /select\s+/i,  // SELECT
    /union\s+/i,   // UNION
    /or\s+/i,      // OR (used in boolean injection)
    /and\s+/i,     // AND
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalized)) {
      console.error(`[SQL SECURITY] Dangerous pattern detected in institute number: ${normalized}`);
      throw new Error('Invalid institute number format');
    }
  }

  // Must match safe pattern
  if (!SAFE_INSTITUTE_NUMBER_REGEX.test(normalized)) {
    throw new Error('Institute number contains invalid characters');
  }

  return normalized;
};

/**
 * Sanitizes a value for use as a dynamic table name suffix
 * Removes hyphens and validates the result
 */
export const sanitizeTableSuffix = (value: string | number | null | undefined): string => {
  const validated = validateInstituteNumber(value);

  // Replace hyphens with underscores (for UUIDs)
  const sanitized = validated.replace(/-/g, '_');

  // Final validation
  if (!SAFE_TABLE_NAME_REGEX.test(sanitized) && !/^[0-9]+$/.test(sanitized)) {
    throw new Error('Sanitized value is not safe for table name');
  }

  return sanitized;
};

// ============================================
// SAFE TABLE NAME CONSTRUCTION
// ============================================

type TablePrefix = typeof VALID_TABLE_PREFIXES[number];

/**
 * Safely constructs a dynamic table name
 * @param prefix - Must be one of the valid table prefixes
 * @param instituteNumber - The institute identifier
 * @returns Safe table name string
 * @throws Error if inputs are invalid
 */
export const buildTableName = (prefix: TablePrefix, instituteNumber: string | number | null | undefined): string => {
  // Validate prefix is in allowed list
  if (!VALID_TABLE_PREFIXES.includes(prefix)) {
    throw new Error(`Invalid table prefix: ${prefix}`);
  }

  const suffix = sanitizeTableSuffix(instituteNumber);
  const tableName = `${prefix}${suffix}`;

  // Final length check
  if (tableName.length > MAX_TABLE_NAME_LENGTH) {
    throw new Error('Generated table name exceeds maximum length');
  }

  return tableName;
};

/**
 * Validates an existing table name against allowed patterns
 */
export const validateTableName = (tableName: string): boolean => {
  if (!tableName || typeof tableName !== 'string') {
    return false;
  }

  if (tableName.length > MAX_TABLE_NAME_LENGTH) {
    return false;
  }

  // Check if it matches any valid prefix pattern
  const hasValidPrefix = VALID_TABLE_PREFIXES.some(prefix => tableName.startsWith(prefix));
  if (!hasValidPrefix) {
    return false;
  }

  // Check overall pattern
  return SAFE_TABLE_NAME_REGEX.test(tableName);
};

// ============================================
// QUERY HELPERS
// ============================================

/**
 * Escapes a value for safe use in SQL LIKE queries
 */
export const escapeLikePattern = (value: string): string => {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
};

/**
 * Validates that a value is a valid UUID format
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Validates that a value is a valid numeric ID
 */
export const isValidNumericId = (value: string | number): boolean => {
  const numValue = typeof value === 'number' ? value : parseInt(value, 10);
  return !isNaN(numValue) && numValue > 0 && numValue <= Number.MAX_SAFE_INTEGER;
};

// ============================================
// LOGGING FOR SECURITY AUDIT
// ============================================

/**
 * Logs suspicious SQL-related activity
 */
export const logSuspiciousQuery = (
  userId: string | undefined,
  action: string,
  details: string
): void => {
  console.warn(`[SQL SECURITY ALERT] User: ${userId || 'unknown'} | Action: ${action} | Details: ${details}`);
  // In production, this should log to a security monitoring system
};

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

import { Request, Response, NextFunction } from 'express';
import { IExtendedRequest } from '../middleware/type';

/**
 * Middleware to validate and sanitize instituteNumber from request
 */
export const validateInstituteMiddleware = (
  req: IExtendedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const instituteNumber = req.user?.currentInstituteNumber;

    if (instituteNumber !== null && instituteNumber !== undefined) {
      // Validate the institute number
      const sanitized = sanitizeTableSuffix(instituteNumber);

      // Store sanitized version back
      if (req.user) {
        req.user.currentInstituteNumber = sanitized;
      }
    }

    next();
  } catch (error: any) {
    console.error('[SQL SECURITY] Institute number validation failed:', error.message);
    res.status(400).json({
      message: 'Invalid institute identifier',
      code: 'INVALID_INSTITUTE_ID'
    });
  }
};

/**
 * Middleware to validate instituteNumber from route params
 */
export const validateInstituteParamMiddleware = (paramName: string = 'instituteNumber') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const instituteNumber = req.params[paramName];

      if (instituteNumber) {
        // Validate and sanitize
        const sanitized = sanitizeTableSuffix(instituteNumber);
        req.params[paramName] = sanitized;
      }

      next();
    } catch (error: any) {
      console.error(`[SQL SECURITY] Param ${paramName} validation failed:`, error.message);
      res.status(400).json({
        message: 'Invalid identifier in URL',
        code: 'INVALID_PARAM'
      });
    }
  };
};

export default {
  validateSqlIdentifier,
  validateInstituteNumber,
  sanitizeTableSuffix,
  buildTableName,
  validateTableName,
  escapeLikePattern,
  isValidUUID,
  isValidNumericId,
  logSuspiciousQuery,
  validateInstituteMiddleware,
  validateInstituteParamMiddleware,
};
