/**
 * Environment Configuration Service
 * Validates all required environment variables at startup.
 *
 * SECURITY: Fails fast if critical environment variables are missing in production.
 */

import { z } from "zod";

// ============================================
// ENVIRONMENT SCHEMA
// ============================================

const environmentSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("4000").transform(Number),

  // Database Configuration - Prisma (PostgreSQL)
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string")
    .optional(),
  DIRECT_URL: z
    .string()
    .url("DIRECT_URL must be a valid PostgreSQL connection string")
    .optional(),

  // Database Configuration - Legacy MySQL (Sequelize) - Optional for backward compatibility
  DB_NAME: z.string().optional(),
  DB_USERNAME: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_HOST: z.string().optional().default("localhost"),
  DB_PORT: z
    .string()
    .optional()
    .default("3306")
    .transform((val) => (val ? Number(val) : 3306)),

  // JWT Configuration - CRITICAL for security
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .refine(
      (val) =>
        val !== "your-jwt-secret-key-here" &&
        val !== "your-jwt-secret-key-here-minimum-32-characters",
      "JWT_SECRET must be changed from default value"
    ),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
    .refine(
      (val) => val !== "your-refresh-secret-key-here-minimum-32-characters",
      "JWT_REFRESH_SECRET must be changed from default value"
    ),

  // Frontend URL
  BASE_URL: z.string().url().optional().default("http://localhost:3000"),
  FRONTEND_URL: z.string().url().optional(),

  // OAuth Configuration (optional in development)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CALLBACK_URL: z.string().url().optional(),

  // Google Sheets Integration (optional)
  GOOGLE_SHEETS_CLIENT_ID: z.string().optional(),
  GOOGLE_SHEETS_CLIENT_SECRET: z.string().optional(),
  GOOGLE_SHEETS_REDIRECT_URI: z.string().url().optional(),

  // File Upload
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z.string().default("5242880").transform(Number),

  // Monitoring (optional in development)
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_API_KEY: z.string().optional(),

  // Encryption (required in production)
  DATA_ENCRYPTION_KEY: z.string().optional(),

  // Scheduler
  ENABLE_SCHEDULER: z.enum(["true", "false"]).optional().default("false"),
});

// Production-specific requirements
const productionRequirements = z.object({
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL is required in production for Prisma"),
  JWT_SECRET: z
    .string()
    .min(64, "JWT_SECRET should be 64+ characters in production"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(64, "JWT_REFRESH_SECRET should be 64+ characters in production"),
  DATA_ENCRYPTION_KEY: z
    .string()
    .min(32, "DATA_ENCRYPTION_KEY is required in production"),
  SENTRY_DSN: z
    .string()
    .url("SENTRY_DSN should be configured in production")
    .optional(),
});

// ============================================
// TYPES
// ============================================

export type Environment = z.infer<typeof environmentSchema>;

// ============================================
// VALIDATION FUNCTION
// ============================================

interface ValidationResult {
  success: boolean;
  env?: Environment;
  errors?: string[];
  warnings?: string[];
}

/**
 * Validate environment variables
 * @param env - Environment variables to validate (defaults to process.env)
 * @returns ValidationResult with parsed environment or errors
 */
export const validateEnvironment = (
  env: Record<string, string | undefined> = process.env
): ValidationResult => {
  const warnings: string[] = [];

  // Parse base schema
  const result = environmentSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `${path}: ${issue.message}`;
    });

    return {
      success: false,
      errors,
    };
  }

  const parsedEnv = result.data;

  // Check production requirements
  if (parsedEnv.NODE_ENV === "production") {
    const prodResult = productionRequirements.safeParse(env);

    if (!prodResult.success) {
      const errors = prodResult.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return `[PRODUCTION] ${path}: ${issue.message}`;
      });

      return {
        success: false,
        errors,
      };
    }
  }

  // Add warnings for development defaults
  if (parsedEnv.NODE_ENV !== "production") {
    if (!env.DATABASE_URL && !env.DB_NAME) {
      warnings.push(
        "Neither DATABASE_URL (Prisma) nor DB_NAME (Sequelize) configured - database features will fail"
      );
    }

    if (
      !env.DATA_ENCRYPTION_KEY ||
      env.DATA_ENCRYPTION_KEY.includes("development")
    ) {
      warnings.push("DATA_ENCRYPTION_KEY is using development default");
    }

    if (!env.SENTRY_DSN) {
      warnings.push("SENTRY_DSN not configured - error tracking disabled");
    }

    if (!env.POSTHOG_API_KEY) {
      warnings.push("POSTHOG_API_KEY not configured - analytics disabled");
    }

    if (!env.GOOGLE_CLIENT_ID) {
      warnings.push("Google OAuth not configured");
    }

    if (!env.MICROSOFT_CLIENT_ID) {
      warnings.push("Microsoft OAuth not configured");
    }
  }

  return {
    success: true,
    env: parsedEnv,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

// ============================================
// STARTUP VALIDATION
// ============================================

/**
 * Validate environment and fail fast if invalid
 * Call this at application startup
 */
export const validateEnvOrExit = (): Environment => {
  console.log("[ENV] Validating environment configuration...");

  const result = validateEnvironment();

  if (!result.success) {
    console.error("\n❌ Environment validation failed:");
    result.errors?.forEach((error) => {
      console.error(`   - ${error}`);
    });
    console.error("\nPlease fix the above issues in your .env file.\n");

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("⚠️  Continuing in development mode despite errors...\n");
    }
  }

  if (result.warnings && result.warnings.length > 0) {
    console.warn("\n⚠️  Environment warnings:");
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn("");
  }

  console.log("✅ Environment configuration validated\n");

  return result.env!;
};

// ============================================
// TYPED ENVIRONMENT ACCESS
// ============================================

let validatedEnv: Environment | null = null;

/**
 * Get validated environment variables
 * Throws if validateEnvOrExit hasn't been called
 */
export const getEnv = (): Environment => {
  if (!validatedEnv) {
    validatedEnv = validateEnvOrExit();
  }
  return validatedEnv;
};

/**
 * Check if running in production
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV !== "production";
};

// ============================================
// SECURE ENV DISPLAY (for debugging)
// ============================================

/**
 * Get a redacted version of env for logging
 */
export const getRedactedEnv = (): Record<string, string> => {
  const sensitiveKeys = [
    "PASSWORD",
    "SECRET",
    "KEY",
    "TOKEN",
    "DSN",
    "CREDENTIAL",
  ];

  const redacted: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (!value) continue;

    const isSensitive = sensitiveKeys.some((sensitive) =>
      key.toUpperCase().includes(sensitive)
    );

    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

export default {
  validateEnvironment,
  validateEnvOrExit,
  getEnv,
  isProduction,
  isDevelopment,
  getRedactedEnv,
};
