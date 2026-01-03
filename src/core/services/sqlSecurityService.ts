/**
 * SQL Security Utilities
 */

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

/**
 * Validates that a string is safe to use as an SQL identifier
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

  // Must match safe pattern
  if (!SAFE_INSTITUTE_NUMBER_REGEX.test(normalized)) {
    throw new Error('Institute number contains invalid characters');
  }

  return normalized;
};

/**
 * Sanitizes a value for use as a dynamic table name suffix
 */
export const sanitizeTableSuffix = (value: string | number | null | undefined): string => {
  const validated = validateInstituteNumber(value);

  // Replace hyphens with underscores (for UUIDs)
  const sanitized = validated.replace(/-/g, '_');

  return sanitized;
};

/**
 * Logs suspicious SQL-related activity
 */
export const logSuspiciousQuery = (
  userId: string | undefined,
  action: string,
  details: string
): void => {
  console.warn(`[SQL SECURITY ALERT] User: ${userId || 'unknown'} | Action: ${action} | Details: ${details}`);
};

export default {
  validateSqlIdentifier,
  validateInstituteNumber,
  sanitizeTableSuffix,
  logSuspiciousQuery,
};
