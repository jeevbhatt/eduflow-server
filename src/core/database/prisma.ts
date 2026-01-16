import { PrismaClient } from "@prisma/client";
import { getInstituteId } from "../utils/contextStore";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// 1. Core Base Client (Shared instance to avoid connection pool fragmentation & extension stacking)
const basePrisma = globalForPrisma.prisma ?? prismaClientSingleton();

/**
 * Modern SaaS Architecture: Automated Row-Level Security (RLS)
 *
 * This extension automatically injects the institute context into EVERY query
 * (models and raw SQL) if a context is available in AsyncLocalStorage.
 */
const prisma = basePrisma.$extends({
  model: {
    $allModels: {} // Placeholder to satisfy extension types
  },
  query: {
    $allModels: {
      async $allOperations({ args, query, operation, model }) {
        const instituteId = getInstituteId();

        // 1. Enforce RLS for all model-level operations
        if (instituteId && model) {
          return basePrisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SELECT set_config('app.current_institute_id', '${instituteId}', TRUE)`);

            // Re-route the operation through the transaction client
            const modelKey = model.charAt(0).toLowerCase() + model.slice(1);
            const modelClient = (tx as any)[modelKey];

            if (modelClient && typeof modelClient[operation] === 'function') {
              return modelClient[operation](args);
            }
            return query(args); // Fallback
          });
        }
        return query(args);
      }
    },
    // 2. Enforce RLS for top-level raw queries ($queryRaw, $executeRaw)
    async $queryRaw({ args, query }) {
      const instituteId = getInstituteId();
      if (instituteId) {
        return basePrisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SELECT set_config('app.current_institute_id', '${instituteId}', TRUE)`);
          return tx.$queryRaw(args);
        });
      }
      return query(args);
    },
    async $executeRaw({ args, query }) {
      const instituteId = getInstituteId();
      if (instituteId) {
        return basePrisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`SELECT set_config('app.current_institute_id', '${instituteId}', TRUE)`);
          return tx.$executeRaw(args);
        });
      }
      return query(args);
    }
  }
});

// Cache only the base client for HMR safety
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;

export default prisma;
