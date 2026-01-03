/**
 * Base Prisma Service with RLS Support
 *
 * Provides common CRUD operations and RLS context management
 * All services extending this get automatic multi-tenant isolation
 *
 * @module services/prisma/basePrismaService
 */

import { PrismaClient, Prisma } from "../../generated/prisma/client";
import prisma from "../../database/prisma";

// ============================================
// TYPES
// ============================================

export interface RLSContext {
  userId: string;
  userRole: string;
  instituteId?: string | null;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// RLS CONTEXT MANAGER
// ============================================

/**
 * Sets RLS context for Prisma queries using PostgreSQL set_config
 * This enables row-level security policies to filter data
 *
 * @param context - User context containing userId, userRole, instituteId
 */
export async function setRLSContext(context: RLSContext): Promise<void> {
  const { userId, userRole, instituteId } = context;

  // Set session variables that RLS policies will use
  await prisma.$executeRaw`
    SELECT
      set_config('app.current_user_id', ${userId}, true),
      set_config('app.current_role', ${userRole}, true),
      set_config('app.current_institute_id', ${instituteId || ""}, true)
  `;
}

/**
 * Execute operations within RLS context
 * Wraps Prisma transaction with RLS settings
 */
export async function withRLSContext<T>(
  context: RLSContext,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Set RLS context at start of transaction
    await tx.$executeRaw`
      SELECT
        set_config('app.current_user_id', ${context.userId}, true),
        set_config('app.current_role', ${context.userRole}, true),
        set_config('app.current_institute_id', ${
          context.instituteId || ""
        }, true)
    `;

    // Execute the operation
    return operation(tx);
  });
}

// ============================================
// BASE SERVICE CLASS
// ============================================

/**
 * Abstract base service providing common CRUD operations
 * Extend this for each Prisma model
 */
export abstract class BasePrismaService<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderByInput
> {
  protected prisma: PrismaClient;
  protected abstract modelName: string;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Get the Prisma delegate for this model
   * Must be implemented by subclasses
   */
  protected abstract getDelegate(): any;

  /**
   * Find many records with pagination
   */
  async findMany(
    context: RLSContext,
    options: {
      where?: TWhereInput;
      orderBy?: TOrderByInput;
      include?: any;
    } & PaginationOptions
  ): Promise<PaginatedResult<TModel>> {
    const { page = 1, limit = 20, where, orderBy, include } = options;
    const skip = (page - 1) * limit;

    return withRLSContext(context, async (tx) => {
      const delegate = this.getDelegate();

      const [data, total] = await Promise.all([
        delegate.findMany({
          where,
          orderBy,
          include,
          skip,
          take: limit,
        }),
        delegate.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    });
  }

  /**
   * Find a single record by ID
   */
  async findById(
    context: RLSContext,
    id: string,
    include?: any
  ): Promise<TModel | null> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.findUnique({
        where: { id },
        include,
      });
    });
  }

  /**
   * Find a single record by criteria
   */
  async findOne(
    context: RLSContext,
    where: TWhereInput,
    include?: any
  ): Promise<TModel | null> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.findFirst({
        where,
        include,
      });
    });
  }

  /**
   * Create a new record
   */
  async create(
    context: RLSContext,
    data: TCreateInput,
    include?: any
  ): Promise<TModel> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.create({
        data,
        include,
      });
    });
  }

  /**
   * Update a record by ID
   */
  async update(
    context: RLSContext,
    id: string,
    data: TUpdateInput,
    include?: any
  ): Promise<TModel> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.update({
        where: { id },
        data,
        include,
      });
    });
  }

  /**
   * Delete a record by ID (soft delete if model supports it)
   */
  async delete(context: RLSContext, id: string): Promise<TModel> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();

      // Check if model has deletedAt field for soft delete
      // If so, use soft delete
      try {
        return delegate.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      } catch {
        // Fall back to hard delete if soft delete fails
        return delegate.delete({
          where: { id },
        });
      }
    });
  }

  /**
   * Hard delete a record
   */
  async hardDelete(context: RLSContext, id: string): Promise<TModel> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.delete({
        where: { id },
      });
    });
  }

  /**
   * Soft delete a record by setting deletedAt
   */
  async softDelete(context: RLSContext, id: string): Promise<TModel> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  /**
   * Count records matching criteria
   */
  async count(context: RLSContext, where?: TWhereInput): Promise<number> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.count({ where });
    });
  }

  /**
   * Check if a record exists
   */
  async exists(context: RLSContext, where: TWhereInput): Promise<boolean> {
    const count = await this.count(context, where);
    return count > 0;
  }

  /**
   * Bulk create records
   */
  async createMany(
    context: RLSContext,
    data: TCreateInput[]
  ): Promise<{ count: number }> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.createMany({
        data,
        skipDuplicates: true,
      });
    });
  }

  /**
   * Bulk update records
   */
  async updateMany(
    context: RLSContext,
    where: TWhereInput,
    data: TUpdateInput
  ): Promise<{ count: number }> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.updateMany({
        where,
        data,
      });
    });
  }

  /**
   * Bulk delete records
   */
  async deleteMany(
    context: RLSContext,
    where: TWhereInput
  ): Promise<{ count: number }> {
    return withRLSContext(context, async () => {
      const delegate = this.getDelegate();
      return delegate.deleteMany({
        where,
      });
    });
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert pagination params from query string
 */
export function parsePaginationParams(query: any): PaginationOptions {
  return {
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 20,
    sortBy: query.sortBy || "createdAt",
    sortOrder: query.sortOrder === "asc" ? "asc" : "desc",
  };
}

/**
 * Build orderBy object from pagination options
 */
export function buildOrderBy(
  sortBy: string,
  sortOrder: "asc" | "desc"
): Record<string, "asc" | "desc"> {
  return { [sortBy]: sortOrder };
}
