/**
 * Tenant Query Utilities
 *
 * Helpers for building tenant-scoped database queries.
 * Ensures all queries properly filter by instituteId.
 */

/**
 * Adds instituteId to a Prisma where clause.
 * Throws if instituteId is missing and not exempt.
 */
export const withTenant = <T extends Record<string, any>>(
  instituteId: string | null | undefined,
  where: T,
  options?: { allowNull?: boolean }
): T & { instituteId?: string } => {
  // If exempt (null instituteId allowed), return original query
  if (options?.allowNull && instituteId === null) {
    return where;
  }

  // Require instituteId for tenant-scoped queries
  if (!instituteId) {
    throw new Error("Institute ID required for tenant-scoped query");
  }

  return {
    ...where,
    instituteId,
  };
};

/**
 * Creates a tenant-scoped findMany query.
 */
export const tenantFindMany = <T extends Record<string, any>>(
  instituteId: string,
  query: T
): T & { where: { instituteId: string } } => {
  return {
    ...query,
    where: {
      ...(query.where || {}),
      instituteId,
    },
  };
};

/**
 * Validates that a record belongs to the expected institute.
 * Use after fetching to ensure data isolation.
 */
export const validateTenantOwnership = (
  record: { instituteId?: string } | null,
  expectedInstituteId: string
): boolean => {
  if (!record) {
    return false;
  }
  return record.instituteId === expectedInstituteId;
};

/**
 * Tenant-safe wrapper for Prisma operations.
 * Automatically injects instituteId into queries.
 */
export class TenantScope {
  constructor(private instituteId: string) {}

  where<T extends Record<string, any>>(clause: T): T & { instituteId: string } {
    return {
      ...clause,
      instituteId: this.instituteId,
    };
  }

  validate(record: { instituteId?: string } | null): boolean {
    return validateTenantOwnership(record, this.instituteId);
  }
}

export default { withTenant, tenantFindMany, validateTenantOwnership, TenantScope };
