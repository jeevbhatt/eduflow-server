/**
 * Input Validation Service
 * Provides Zod schemas for validating all API inputs with XSS sanitization.
 *
 * SECURITY: All user inputs must be validated before processing.
 */

import { z } from 'zod';
import xss from 'xss';
import { Request, Response, NextFunction } from 'express';

// ============================================
// XSS SANITIZATION
// ============================================

// Configure XSS filter options
const xssOptions = {
  whiteList: {}, // No HTML allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitize a string to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return input;
  return xss(input.trim(), xssOptions);
};

/**
 * Recursively sanitize all string values in an object
 */
export const sanitizeObject = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

// ============================================
// COMMON VALIDATION PATTERNS
// ============================================

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform(val => val.toLowerCase().trim());

// Password validation
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Simple password (for backward compatibility)
const simplePasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

// Name validation
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .transform(val => sanitizeString(val));

// Phone number
const phoneSchema = z.string()
  .regex(/^[\d\s\-+()]{7,20}$/, 'Invalid phone number format')
  .transform(val => val.replace(/\s/g, ''));

// UUID validation
const uuidSchema = z.string()
  .uuid('Invalid ID format');

// Numeric ID (for legacy compatibility)
const numericIdSchema = z.string()
  .regex(/^\d+$/, 'Invalid numeric ID')
  .or(z.number().int().positive());

// Safe string (no HTML)
const safeStringSchema = z.string()
  .max(1000, 'Text too long')
  .transform(val => sanitizeString(val));

// Long text (for descriptions, bios)
const longTextSchema = z.string()
  .max(5000, 'Text too long')
  .transform(val => sanitizeString(val));

// ============================================
// AUTH SCHEMAS
// ============================================

export const authSchemas = {
  register: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: simplePasswordSchema,
    role: z.enum(['student', 'teacher', 'admin']).optional().default('student'),
  }),

  login: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),

  mfaFinalize: z.object({
    mfaChallenge: z.string().min(1, 'MFA challenge required'),
    token: z.string().length(6, 'MFA token must be 6 digits').regex(/^\d+$/, 'MFA token must be numeric'),
  }),

  mfaVerify: z.object({
    token: z.string().length(6, 'Token must be 6 digits').regex(/^\d+$/, 'Token must be numeric'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),

  sendOtp: z.object({
    email: emailSchema,
  }),

  verifyOtp: z.object({
    email: emailSchema,
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
  }),

  updateProfile: z.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    phone: phoneSchema.optional(),
    bio: longTextSchema.optional(),
  }),
};

// ============================================
// STUDENT SCHEMAS
// ============================================

export const studentSchemas = {
  create: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    studentPhoneNo: phoneSchema,
    studentAddress: safeStringSchema,
    enrolledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
    studentImage: z.string().url().optional(),
  }),

  update: z.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    studentPhoneNo: phoneSchema.optional(),
    studentAddress: safeStringSchema.optional(),
    studentImage: z.string().url().optional(),
  }),
};

// ============================================
// TEACHER SCHEMAS
// ============================================

export const teacherSchemas = {
  create: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    teacherEmail: emailSchema,
    teacherPhoneNumber: phoneSchema,
    teacherExperience: z.number().int().min(0).max(50),
    teacherSalary: z.number().positive(),
    teacherJoinedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
    courseId: numericIdSchema,
  }),
};

// ============================================
// COURSE SCHEMAS
// ============================================

export const courseSchemas = {
  create: z.object({
    courseName: safeStringSchema,
    courseDescription: longTextSchema,
    coursePrice: z.number().min(0),
    courseDuration: z.number().int().positive(),
    courseLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    categoryId: numericIdSchema,
  }),
};

// ============================================
// CATEGORY SCHEMAS
// ============================================

export const categorySchemas = {
  create: z.object({
    categoryName: safeStringSchema,
    categoryDescription: longTextSchema.optional(),
  }),
};

// ============================================
// INSTITUTE SCHEMAS
// ============================================

export const instituteSchemas = {
  create: z.object({
    instituteName: safeStringSchema,
    instituteEmail: emailSchema,
    institutePhoneNumber: phoneSchema,
    instituteAddress: safeStringSchema.optional(),
    institutePanNo: z.string().max(20).optional(),
    instituteVatNo: z.string().max(20).optional(),
  }),

  update: z.object({
    instituteName: safeStringSchema.optional(),
    instituteEmail: emailSchema.optional(),
    institutePhoneNumber: phoneSchema.optional(),
    instituteAddress: safeStringSchema.optional(),
    institutePanNo: z.string().max(20).optional(),
    instituteVatNo: z.string().max(20).optional(),
  }),
};

// ============================================
// ATTENDANCE SCHEMAS
// ============================================

export const attendanceSchemas = {
  mark: z.object({
    studentId: numericIdSchema,
    courseId: numericIdSchema,
    attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    remarks: safeStringSchema.optional(),
  }),
};

// ============================================
// ASSESSMENT SCHEMAS
// ============================================

export const assessmentSchemas = {
  create: z.object({
    courseId: numericIdSchema,
    title: safeStringSchema,
    assessmentType: z.enum(['quiz', 'exam', 'assignment', 'project']),
    maxMarks: z.number().int().positive().max(1000),
    assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format: YYYY-MM-DD'),
  }),
};

// ============================================
// RESULT SCHEMAS
// ============================================

export const resultSchemas = {
  submit: z.object({
    studentId: numericIdSchema,
    assessmentId: numericIdSchema,
    marksObtained: z.number().min(0),
    remarks: safeStringSchema.optional(),
  }),
};

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

type ZodSchema = z.ZodType<any, any, any>;

/**
 * Create validation middleware for a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Get data from specified source
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

      // Sanitize input first
      const sanitized = sanitizeObject(data);

      // Parse and validate
      const result = schema.safeParse(sanitized);

      if (!result.success) {
        const errors = result.error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors,
        });
        return;
      }

      // Replace with validated/sanitized data
      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'query') {
        (req as any).query = result.data;
      } else {
        (req as any).params = result.data;
      }

      next();
    } catch (error: any) {
      console.error('[VALIDATION] Error:', error);
      res.status(400).json({
        message: 'Invalid request data',
        code: 'VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Middleware to sanitize all request body data
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query && typeof req.query === 'object') {
    (req as any).query = sanitizeObject(req.query);
  }
  next();
};

// ============================================
// ID PARAMETER VALIDATION
// ============================================

/**
 * Validate route parameter is a valid ID
 */
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];

    if (!id) {
      res.status(400).json({
        message: `${paramName} is required`,
        code: 'MISSING_PARAM',
      });
      return;
    }

    // Check if UUID or numeric
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isNumeric = /^\d+$/.test(id);

    if (!isUuid && !isNumeric) {
      res.status(400).json({
        message: `Invalid ${paramName} format`,
        code: 'INVALID_PARAM',
      });
      return;
    }

    next();
  };
};

export default {
  authSchemas,
  studentSchemas,
  teacherSchemas,
  courseSchemas,
  categorySchemas,
  instituteSchemas,
  attendanceSchemas,
  assessmentSchemas,
  resultSchemas,
  validate,
  validateIdParam,
  sanitizeBody,
  sanitizeQuery,
  sanitizeString,
  sanitizeObject,
};
