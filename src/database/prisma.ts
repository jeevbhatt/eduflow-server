/**
 * Prisma Client Singleton for Supabase PostgreSQL
 *
 * Prisma 7 Configuration:
 * - Uses @prisma/adapter-pg for PostgreSQL driver
 * - DATABASE_URL: Pooled Supavisor connection (port 6543) for runtime
 * - DIRECT_URL: Direct connection (port 5432) in prisma.config.ts for migrations
 *
 * Connection Strategy (Supabase):
 * - Runtime queries use pooled connection via Supavisor
 * - CLI operations (migrations) use direct connection
 *
 * @see https://www.prisma.io/docs/guides/database/supabase
 * @see https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-to-prisma-7
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Declare global type for development hot-reload
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with PostgreSQL adapter
 * Uses pooled connection string from DATABASE_URL
 */
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please configure your Supabase connection string."
    );
  }

  // Create PostgreSQL driver adapter with pooled connection
  const adapter = new PrismaPg({ connectionString });

  // Return Prisma client with adapter
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });
}

// Singleton pattern: reuse existing instance in development
// Prevents "too many connections" error during hot reloads
const prisma = globalThis.prisma ?? createPrismaClient();

// Store instance globally in development
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;

// Named export for flexibility
export { prisma };
