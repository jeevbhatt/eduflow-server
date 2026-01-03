/**
 * Security Headers Middleware
 * Provides comprehensive HTTP security headers using Helmet.js and custom middleware.
 *
 * SECURITY: Protects against XSS, clickjacking, MIME sniffing, and other attacks.
 */

import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================
// HELMET CONFIGURATION
// ============================================

/**
 * Configure Helmet with strict security settings
 */
export const helmetConfig = helmet({
  // Content Security Policy - Restricts resource loading
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline for React hydration
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.posthog.com",
        "https://*.sentry.io",
        process.env.FRONTEND_URL || "http://localhost:3000",
      ],
      frameSrc: ["'none'"], // No iframes allowed
      objectSrc: ["'none'"], // No plugins
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // Strict-Transport-Security - Force HTTPS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options - Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options - Prevent MIME sniffing
  noSniff: true,

  // X-XSS-Protection - Legacy XSS filter
  xssFilter: true,

  // Referrer-Policy - Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-DNS-Prefetch-Control - Disable DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Permitted-Cross-Domain-Policies - Restrict Adobe Flash/PDF
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,
});

// ============================================
// CSRF PROTECTION
// ============================================

// CSRF Token store (in production, use Redis)
const csrfTokens = new Map<string, { token: string; expires: number }>();
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token for a session
 */
export const generateCsrfToken = (sessionId: string): string => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + CSRF_TOKEN_EXPIRY,
  });

  // Cleanup old tokens periodically
  if (csrfTokens.size > 10000) {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (value.expires < now) {
        csrfTokens.delete(key);
      }
    }
  }

  return token;
};

/**
 * Validate a CSRF token
 */
export const validateCsrfToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId);

  if (!stored) return false;
  if (stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  const storedBuffer = Buffer.from(stored.token);
  const tokenBuffer = Buffer.from(token);

  if (storedBuffer.length !== tokenBuffer.length) return false;

  return crypto.timingSafeEqual(storedBuffer, tokenBuffer);
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  // Skip CSRF for API token authentication (Bearer tokens are CSRF-resistant)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // For cookie-based auth, validate CSRF token
  const csrfToken = req.headers['x-csrf-token'] as string || req.body?._csrf;
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;

  if (!sessionId || !csrfToken) {
    res.status(403).json({
      message: 'CSRF token missing',
      code: 'CSRF_MISSING'
    });
    return;
  }

  if (!validateCsrfToken(sessionId, csrfToken)) {
    res.status(403).json({
      message: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
    return;
  }

  next();
};

/**
 * Endpoint to get a CSRF token
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  // Generate session ID if not present
  let sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  const token = generateCsrfToken(sessionId);

  res.status(200).json({
    csrfToken: token
  });
};

// ============================================
// ADDITIONAL SECURITY HEADERS
// ============================================

/**
 * Additional security headers not covered by Helmet
 */
export const additionalSecurityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Permissions-Policy (formerly Feature-Policy)
  res.setHeader('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '));

  // Cross-Origin headers
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

  // Cache control for sensitive data
  if (_req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// ============================================
// SECURITY RESPONSE HEADERS FOR ERRORS
// ============================================

/**
 * Sanitize error responses to prevent information leakage
 */
export const sanitizeErrorResponse = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Don't expose stack traces in production
  if (process.env.NODE_ENV === 'production') {
    // Log the full error for debugging
    console.error('[ERROR]', err);

    // Send sanitized response
    const statusCode = err.status || err.statusCode || 500;
    const message = statusCode === 500
      ? 'Internal server error'
      : err.message || 'An error occurred';

    res.status(statusCode).json({
      message,
      code: err.code || 'ERROR'
    });
    return;
  }

  // In development, pass to next error handler
  next(err);
};

// ============================================
// COMBINED SECURITY MIDDLEWARE
// ============================================

/**
 * Apply all security middleware in correct order
 */
export const applySecurityMiddleware = (app: any): void => {
  // 1. Helmet (must be first)
  app.use(helmetConfig);

  // 2. Additional security headers
  app.use(additionalSecurityHeaders);

  // 3. CSRF token endpoint (before CSRF protection)
  app.get('/api/csrf-token', getCsrfToken);

  // Note: CSRF protection is optional for Bearer token auth
  // Uncomment below to enable for cookie-based auth:
  // app.use(csrfProtection);
};

export default {
  helmetConfig,
  additionalSecurityHeaders,
  csrfProtection,
  getCsrfToken,
  generateCsrfToken,
  validateCsrfToken,
  sanitizeErrorResponse,
  applySecurityMiddleware,
};
