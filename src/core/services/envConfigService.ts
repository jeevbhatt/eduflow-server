import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000").transform(Number),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32).default("your-jwt-secret-key-here-minimum-32-characters"),
  JWT_REFRESH_SECRET: z.string().min(32).default("your-refresh-secret-key-here-minimum-32-characters"),
  BASE_URL: z.string().optional().default("http://localhost:3000"),
  FRONTEND_URL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export const validateEnvOrExit = (): Environment => {
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Environment validation failed:", result.error.format());
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
  return result.data as Environment;
};

export default {
  validateEnvOrExit,
};
