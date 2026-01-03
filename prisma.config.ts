/**
 * Prisma Configuration for Supabase Integration (Prisma 7+)
 *
 * Since Prisma 7, datasource URLs must be configured here for CLI operations.
 * - DIRECT_URL: For migrations and introspection (bypasses connection pooler)
 * - DATABASE_URL: For runtime queries (uses connection pooling)
 */
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load environment variables
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
