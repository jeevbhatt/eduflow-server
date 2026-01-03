/**
 * Prisma Configuration for Supabase Integration
 *
 * This configuration uses two connection strategies:
 * - DIRECT_URL: For Prisma CLI operations (migrations, introspection)
 *   Uses direct PostgreSQL connection (port 5432) bypassing connection pooler
 * - DATABASE_URL: For Prisma Client runtime queries
 *   Uses Supavisor connection pooling (port 6543) for better performance
 *
 * @see https://www.prisma.io/docs/guides/database/supabase
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
  // DIRECT_URL for CLI operations (migrations, db push, introspection)
  // This bypasses connection pooling which is required for DDL operations
  datasource: {
    url: env("DIRECT_URL"),
  },
});
