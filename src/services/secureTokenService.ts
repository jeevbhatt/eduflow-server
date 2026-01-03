import * as jose from "jose";
import crypto from "crypto";

// ============================================
// SECURE TOKEN CONFIGURATION
// ============================================

// CRITICAL: Never use fallback secrets in production
const getSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET must be set and at least 32 characters in production');
    }
    console.warn('[SECURITY WARNING] JWT_SECRET not properly configured - using development fallback');
    // Only allow this fallback in development
    return new TextEncoder().encode('dev-only-secret-key-min-32-chars!');
  }
  return new TextEncoder().encode(secret);
};

const getRefreshSecretKey = (): Uint8Array => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_REFRESH_SECRET must be set in production');
    }
    return new TextEncoder().encode('dev-refresh-secret-key-32-chars!');
  }
  return new TextEncoder().encode(secret + '-refresh');
};

const ALG = "HS256";
const ISSUER = "eduflow-saas";
const AUDIENCE = "eduflow-clients";

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m";  // 15 minutes (was 7 days - SECURITY FIX)
const REFRESH_TOKEN_EXPIRY = "7d";  // 7 days for refresh token
const MFA_CHALLENGE_EXPIRY = "5m";  // 5 minutes for MFA challenge

// ============================================
// TOKEN PAYLOAD INTERFACES
// ============================================

export interface TokenPayload {
  id: string;
  role?: string;
  currentInstituteNumber?: string | number | null;
  instituteNumber?: string | number | null;
  type?: 'access' | 'refresh' | 'mfa_challenge';
}

export interface MFAChallengePayload {
  challengeId: string;
  userId: string;
  type: 'mfa_challenge';
  exp: number;
}

// ============================================
// TOKEN BLACKLIST (In-memory for now, use Redis in production)
// ============================================

const tokenBlacklist = new Set<string>();

export const blacklistToken = (tokenId: string): void => {
  tokenBlacklist.add(tokenId);
  // Optional: Set TTL cleanup for memory management
  setTimeout(() => tokenBlacklist.delete(tokenId), 7 * 24 * 60 * 60 * 1000); // 7 days
};

export const isTokenBlacklisted = (tokenId: string): boolean => {
  return tokenBlacklist.has(tokenId);
};

// ============================================
// LOGIN ATTEMPT TRACKING
// ============================================

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 30 * 60 * 1000; // 30 minutes

export const checkLoginAttempts = (identifier: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } => {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (!attempt) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Check if locked
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: attempt.lockedUntil };
  }

  // Reset if outside window
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  const remaining = MAX_LOGIN_ATTEMPTS - attempt.count;
  return { allowed: remaining > 0, remainingAttempts: remaining };
};

export const recordLoginAttempt = (identifier: string, success: boolean): void => {
  const now = Date.now();

  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const attempt = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  attempt.count += 1;
  attempt.lastAttempt = now;

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION;
  }

  loginAttempts.set(identifier, attempt);
};

// ============================================
// MFA ATTEMPT TRACKING
// ============================================

const mfaAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_MFA_ATTEMPTS = 5;

export const checkMFAAttempts = (challengeId: string): boolean => {
  const attempt = mfaAttempts.get(challengeId);
  if (!attempt) return true;
  return attempt.count < MAX_MFA_ATTEMPTS;
};

export const recordMFAAttempt = (challengeId: string, success: boolean): void => {
  if (success) {
    mfaAttempts.delete(challengeId);
    return;
  }

  const attempt = mfaAttempts.get(challengeId) || { count: 0, lastAttempt: Date.now() };
  attempt.count += 1;
  attempt.lastAttempt = Date.now();
  mfaAttempts.set(challengeId, attempt);
};

// ============================================
// TOKEN GENERATION
// ============================================

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = async (payload: TokenPayload): Promise<string> => {
  const tokenId = crypto.randomUUID();

  const jwt = await new jose.SignJWT({ ...payload, type: 'access', jti: tokenId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecretKey());

  return jwt;
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = async (payload: Pick<TokenPayload, 'id'>): Promise<string> => {
  const tokenId = crypto.randomUUID();

  const jwt = await new jose.SignJWT({ id: payload.id, type: 'refresh', jti: tokenId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getRefreshSecretKey());

  return jwt;
};

/**
 * Generate MFA challenge token (very short-lived, encrypted userId)
 */
export const generateMFAChallenge = async (userId: string): Promise<string> => {
  const challengeId = crypto.randomUUID();

  // Store mapping securely (in production, use Redis with short TTL)
  mfaChallengeMap.set(challengeId, { userId, createdAt: Date.now() });

  // Clean up old challenges
  setTimeout(() => mfaChallengeMap.delete(challengeId), 5 * 60 * 1000);

  const jwt = await new jose.SignJWT({ challengeId, type: 'mfa_challenge' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(MFA_CHALLENGE_EXPIRY)
    .sign(getSecretKey());

  return jwt;
};

// MFA challenge mapping (userId is never exposed in response)
const mfaChallengeMap = new Map<string, { userId: string; createdAt: number }>();

export const resolveMFAChallenge = (challengeId: string): string | null => {
  const challenge = mfaChallengeMap.get(challengeId);
  if (!challenge) return null;

  // Expired check (5 minutes)
  if (Date.now() - challenge.createdAt > 5 * 60 * 1000) {
    mfaChallengeMap.delete(challengeId);
    return null;
  }

  return challenge.userId;
};

// ============================================
// TOKEN VERIFICATION
// ============================================

/**
 * Verify access token with full validation
 */
export const verifyAccessToken = async (token: string): Promise<TokenPayload> => {
  try {
    const { payload } = await jose.jwtVerify(token, getSecretKey(), {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    // Check token type
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    // Check if blacklisted
    if (payload.jti && isTokenBlacklisted(payload.jti as string)) {
      throw new Error('Token has been revoked');
    }

    return payload as unknown as TokenPayload;
  } catch (error: any) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = async (token: string): Promise<{ id: string; jti: string }> => {
  try {
    const { payload } = await jose.jwtVerify(token, getRefreshSecretKey(), {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    if (payload.jti && isTokenBlacklisted(payload.jti as string)) {
      throw new Error('Refresh token has been revoked');
    }

    return { id: payload.id as string, jti: payload.jti as string };
  } catch (error: any) {
    throw new Error(`Refresh token verification failed: ${error.message}`);
  }
};

/**
 * Verify MFA challenge token
 */
export const verifyMFAChallenge = async (token: string): Promise<{ challengeId: string }> => {
  try {
    const { payload } = await jose.jwtVerify(token, getSecretKey(), {
      algorithms: [ALG],
      issuer: ISSUER,
    });

    if (payload.type !== 'mfa_challenge') {
      throw new Error('Invalid token type');
    }

    return { challengeId: payload.challengeId as string };
  } catch (error: any) {
    throw new Error(`MFA challenge verification failed: ${error.message}`);
  }
};

// ============================================
// TOKEN PAIR GENERATION (for login response)
// ============================================

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export const generateTokenPair = async (payload: TokenPayload): Promise<TokenPair> => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken({ id: payload.id }),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
};

// ============================================
// LEGACY COMPATIBILITY (to be deprecated)
// ============================================

/**
 * @deprecated Use generateAccessToken instead
 */
const generateJWTToken = async (payload: TokenPayload): Promise<string> => {
  console.warn('[DEPRECATION WARNING] generateJWTToken is deprecated, use generateAccessToken');
  return generateAccessToken(payload);
};

/**
 * @deprecated Use verifyAccessToken instead
 */
export const verifyJwtToken = async (token: string): Promise<TokenPayload> => {
  return verifyAccessToken(token);
};

export default generateJWTToken;
