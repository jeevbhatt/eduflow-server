/**
 * Secure Error Handler & Logging
 * Production-safe error responses with sensitive data filtering.
 *
 * SECURITY: Never expose internal details, stack traces, or sensitive data in production.
 */

import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';

// ============================================
// SENSITIVE DATA PATTERNS
// ============================================

// Fields to redact from logs and responses
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'sessionId',
  'session_id',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'social_security',
  'mfaSecret',
  'otp',
  'pin',
  'privateKey',
  'private_key',
];

// Patterns to detect sensitive data in strings
const SENSITIVE_PATTERNS = [
  /password[=:]\S+/gi,
  /token[=:]\S+/gi,
  /bearer\s+\S+/gi,
  /api[_-]?key[=:]\S+/gi,
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
  /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, // SSN
];

// ============================================
// DATA SANITIZATION
// ============================================

/**
 * Redact sensitive fields from an object (deep clone)
 */
export const redactSensitiveData = <T>(obj: T, depth: number = 0): T => {
  if (depth > 10) return obj; // Prevent infinite recursion

  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    let sanitized: string = obj;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item, depth + 1)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains any sensitive field name
      const isSensitive = SENSITIVE_FIELDS.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return obj;
};

// ============================================
// ERROR INTERFACE
// ============================================

interface IAppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  expose?: boolean;
}

// Error type mapping for user-friendly messages
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request',
  401: 'Authentication required',
  403: 'Access denied',
  404: 'Resource not found',
  409: 'Resource conflict',
  422: 'Validation failed',
  429: 'Too many requests',
  500: 'Internal server error',
  502: 'Service temporarily unavailable',
  503: 'Service unavailable',
};

// ============================================
// SECURE LOGGER
// ============================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
}

interface LogContext {
  userId?: string;
  instituteId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Secure logger that redacts sensitive data
 */
export const secureLog = (
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void => {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? redactSensitiveData(context) : undefined;

  const logEntry = {
    timestamp,
    level,
    message,
    ...(sanitizedContext && { context: sanitizedContext }),
    ...(error && process.env.NODE_ENV !== 'production' && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }),
    ...(error && process.env.NODE_ENV === 'production' && {
      error: {
        name: error.name,
        message: error.message,
        // No stack trace in production
      }
    }),
  };

  // Format output based on environment
  if (process.env.NODE_ENV === 'production') {
    // Structured JSON for log aggregation
    console.log(JSON.stringify(logEntry));
  } else {
    // Human-readable for development
    const prefix = `[${timestamp}] [${level}]`;
    console.log(prefix, message, sanitizedContext || '');
    if (error && level === LogLevel.ERROR) {
      console.error(error);
    }
  }

  // Report to Sentry for errors
  if (level === LogLevel.ERROR && error) {
    Sentry.captureException(error, {
      extra: sanitizedContext,
    });
  }

  // Special handling for security alerts
  if (level === LogLevel.SECURITY) {
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: sanitizedContext,
      tags: { type: 'security_alert' },
    });
  }
};

// Convenience methods
export const logDebug = (message: string, context?: LogContext) =>
  secureLog(LogLevel.DEBUG, message, context);

export const logInfo = (message: string, context?: LogContext) =>
  secureLog(LogLevel.INFO, message, context);

export const logWarn = (message: string, context?: LogContext) =>
  secureLog(LogLevel.WARN, message, context);

export const logError = (message: string, context?: LogContext, error?: Error) =>
  secureLog(LogLevel.ERROR, message, context, error);

export const logSecurity = (message: string, context?: LogContext) =>
  secureLog(LogLevel.SECURITY, message, context);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

/**
 * Production-safe global error handler
 * Must be the LAST middleware in the chain
 */
const globalErrorHandler = (
  err: IAppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default status code
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational ?? false;
  const isProduction = process.env.NODE_ENV === 'production';

  // Build log context (redacted)
  const logContext: LogContext = {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: redactSensitiveData(req.body),
    query: redactSensitiveData(req.query),
  };

  // Log the error securely
  if (statusCode >= 500) {
    logError(`${req.method} ${req.path} - ${err.message}`, logContext, err);
  } else if (statusCode >= 400) {
    logWarn(`${req.method} ${req.path} - ${err.message}`, logContext);
  }

  // Determine user-facing message
  let userMessage: string;

  if (isOperational || err.expose) {
    // Operational errors are safe to expose
    userMessage = err.message;
  } else if (isProduction) {
    // In production, use generic messages for non-operational errors
    userMessage = ERROR_MESSAGES[statusCode] || 'An error occurred';
  } else {
    // In development, show actual error
    userMessage = err.message;
  }

  // Build response
  const response: Record<string, any> = {
    status: 'error',
    message: userMessage,
    code: err.code || `ERROR_${statusCode}`,
  };

  // Add debug info in development
  if (!isProduction) {
    response.stack = err.stack;
    response.details = err.message;
  }

  // Set security headers on error response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.status(statusCode).json(response);
};

// ============================================
// CUSTOM ERROR CLASS
// ============================================

/**
 * Custom error class for operational errors
 * Operational errors are safe to expose to users
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  expose: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.expose = statusCode < 500; // Client errors are safe to expose
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// ERROR FACTORY FUNCTIONS
// ============================================

export const createNotFoundError = (resource: string) =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');

export const createValidationError = (message: string) =>
  new AppError(message, 400, 'VALIDATION_ERROR');

export const createUnauthorizedError = (message: string = 'Authentication required') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const createForbiddenError = (message: string = 'Access denied') =>
  new AppError(message, 403, 'FORBIDDEN');

export const createConflictError = (message: string = 'Resource conflict') =>
  new AppError(message, 409, 'CONFLICT');

export const createRateLimitError = (retryAfter: number = 60) =>
  new AppError(`Too many requests. Please try again in ${retryAfter} seconds.`, 429, 'RATE_LIMIT');

// ============================================
// REQUEST CONTEXT BUILDER
// ============================================

/**
 * Build secure log context from request
 */
export const buildRequestContext = (req: Request): LogContext => {
  return {
    path: req.path,
    method: req.method,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    requestId: req.get('x-request-id'),
  };
};

export default globalErrorHandler;
