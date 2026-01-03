/**
 * Legacy MySQL/Sequelize Connection (DISABLED)
 *
 * ⚠️ THIS PROJECT NOW USES PRISMA + SUPABASE POSTGRESQL ONLY
 *
 * This file exports a mock object for backward compatibility.
 * Legacy code that imports sequelize will receive a stub that:
 * - Won't crash on import
 * - Returns empty results for queries
 * - Logs warnings to help identify code needing migration
 *
 * Migration path:
 * - Replace: import sequelize from './database/connection'
 * - With:    import prisma from './database/prisma'
 */

console.log(
  "ℹ️  MySQL/Sequelize DISABLED - Using Prisma + Supabase PostgreSQL only"
);

// Create a mock object that mimics Sequelize interface
// but doesn't actually connect to any database
const sequelize = {
  // Mock authenticate - always succeeds
  authenticate: async () => {
    console.warn("⚠️  sequelize.authenticate() called - MySQL is disabled");
    return Promise.resolve();
  },

  // Mock sync - always succeeds
  sync: async () => {
    console.warn("⚠️  sequelize.sync() called - MySQL is disabled");
    return Promise.resolve();
  },

  // Mock query - returns empty results with warning
  query: async (...args: any[]) => {
    console.warn(
      "⚠️  LEGACY SQL QUERY CALLED - This route needs migration to Prisma!"
    );
    console.warn(
      "⚠️  Query attempted:",
      typeof args[0] === "string" ? args[0].substring(0, 100) : "unknown"
    );
    // Return empty array to prevent crashes
    return [[], {}];
  },

  // Mock transaction
  transaction: async (callback?: any) => {
    console.warn("⚠️  sequelize.transaction() called - MySQL is disabled");
    if (typeof callback === "function") {
      return callback({
        commit: async () => {},
        rollback: async () => {},
      });
    }
    return {
      commit: async () => {},
      rollback: async () => {},
    };
  },

  // Mock close
  close: async () => {
    return Promise.resolve();
  },

  // Mock getQueryInterface
  getQueryInterface: () => ({
    showAllTables: async () => [],
    describeTable: async () => ({}),
  }),

  // Mock models
  models: {},

  // Flag to identify this as mock
  _isMock: true,
};

export default sequelize as any;
