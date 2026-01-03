/**
 * Feature Flag & Experiment Service
 *
 * Handles feature flags and A/B experiments
 * Simplified to match actual Prisma schema
 *
 * @module services/prisma/experimentService
 */

import prisma from "../../database/prisma";
import {
  BasePrismaService,
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  FeatureFlag,
  Experiment,
  ExperimentResult,
  ExperimentStatus,
  Prisma,
} from "../../generated/prisma/client";

// Type for experiment variants stored as JSON
interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // percentage (0-100)
}

// ============================================
// FEATURE FLAG SERVICE
// ============================================

class FeatureFlagService extends BasePrismaService<
  FeatureFlag,
  Prisma.FeatureFlagCreateInput,
  Prisma.FeatureFlagUpdateInput,
  Prisma.FeatureFlagWhereInput,
  Prisma.FeatureFlagOrderByWithRelationInput
> {
  protected modelName = "FeatureFlag";

  protected getDelegate() {
    return prisma.featureFlag;
  }

  /**
   * Check if a feature is enabled for a user
   */
  async isFeatureEnabled(
    context: RLSContext,
    flagName: string
  ): Promise<boolean> {
    return withRLSContext(context, async (tx) => {
      const flag = await tx.featureFlag.findUnique({
        where: { name: flagName },
      });

      if (!flag || !flag.isEnabled) {
        return false;
      }

      // Check rollout percentage
      if (flag.rolloutPercentage < 100) {
        // Use user ID hash to determine consistent rollout
        const userHash = this.hashUserId(context.userId);
        if (userHash > flag.rolloutPercentage) {
          return false;
        }
      }

      // Check conditions if present
      if (flag.conditions) {
        return this.evaluateConditions(flag.conditions, context);
      }

      return true;
    });
  }

  /**
   * Hash user ID to number 0-100 for rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) % 100;
    }
    return hash;
  }

  /**
   * Evaluate targeting conditions
   */
  private evaluateConditions(
    conditions: Prisma.JsonValue,
    context: RLSContext
  ): boolean {
    if (!conditions || typeof conditions !== "object") return true;

    const cond = conditions as Record<string, unknown>;

    // Check role conditions
    if (cond.roles && Array.isArray(cond.roles)) {
      if (!cond.roles.includes(context.userRole)) {
        return false;
      }
    }

    // Check institute conditions
    if (cond.instituteIds && Array.isArray(cond.instituteIds)) {
      if (
        context.instituteId &&
        !cond.instituteIds.includes(context.instituteId)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(
    context: RLSContext,
    options?: PaginationOptions
  ): Promise<PaginatedResult<FeatureFlag>> {
    return this.findMany(context, options ?? {});
  }

  /**
   * Create a new feature flag
   */
  async createFlag(
    context: RLSContext,
    data: {
      name: string;
      description?: string;
      isEnabled?: boolean;
      rolloutPercentage?: number;
      conditions?: Record<string, unknown>;
    }
  ): Promise<FeatureFlag> {
    return withRLSContext(context, async (tx) => {
      return tx.featureFlag.create({
        data: {
          name: data.name,
          description: data.description,
          isEnabled: data.isEnabled ?? false,
          rolloutPercentage: data.rolloutPercentage ?? 0,
          conditions: data.conditions as Prisma.InputJsonValue | undefined,
        },
      });
    });
  }

  /**
   * Toggle a feature flag
   */
  async toggleFlag(
    context: RLSContext,
    flagName: string
  ): Promise<FeatureFlag> {
    return withRLSContext(context, async (tx) => {
      const flag = await tx.featureFlag.findUnique({
        where: { name: flagName },
      });

      if (!flag) {
        throw new Error("Feature flag not found");
      }

      return tx.featureFlag.update({
        where: { name: flagName },
        data: { isEnabled: !flag.isEnabled },
      });
    });
  }

  /**
   * Update rollout percentage
   */
  async updateRollout(
    context: RLSContext,
    flagName: string,
    percentage: number
  ): Promise<FeatureFlag> {
    return withRLSContext(context, async (tx) => {
      return tx.featureFlag.update({
        where: { name: flagName },
        data: { rolloutPercentage: Math.min(100, Math.max(0, percentage)) },
      });
    });
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(context: RLSContext, flagName: string): Promise<void> {
    return withRLSContext(context, async (tx) => {
      await tx.featureFlag.delete({
        where: { name: flagName },
      });
    });
  }
}

// ============================================
// EXPERIMENT SERVICE
// ============================================

class ExperimentService extends BasePrismaService<
  Experiment,
  Prisma.ExperimentCreateInput,
  Prisma.ExperimentUpdateInput,
  Prisma.ExperimentWhereInput,
  Prisma.ExperimentOrderByWithRelationInput
> {
  protected modelName = "Experiment";

  protected getDelegate() {
    return prisma.experiment;
  }

  /**
   * Get variant for a user in an experiment
   * Uses deterministic assignment based on user ID
   */
  async getVariantForUser(
    context: RLSContext,
    experimentName: string
  ): Promise<string | null> {
    return withRLSContext(context, async (tx) => {
      const experiment = await tx.experiment.findFirst({
        where: {
          name: experimentName,
          status: ExperimentStatus.running,
        },
      });

      if (!experiment || !experiment.variants) {
        return null;
      }

      // Check if user matches target audience
      if (experiment.targetAudience) {
        const target = experiment.targetAudience as Record<string, unknown>;
        if (target.roles && Array.isArray(target.roles)) {
          if (!target.roles.includes(context.userRole)) {
            return null;
          }
        }
      }

      const variants = experiment.variants as unknown as ExperimentVariant[];
      if (!Array.isArray(variants) || variants.length === 0) {
        return null;
      }

      // Deterministic assignment based on user ID + experiment ID
      const hash = this.hashForAssignment(context.userId, experiment.id);

      // Find variant based on cumulative weight
      let cumulative = 0;
      for (const variant of variants) {
        cumulative += variant.weight;
        if (hash < cumulative) {
          return variant.id;
        }
      }

      // Default to first variant
      return variants[0].id;
    });
  }

  /**
   * Hash user + experiment for variant assignment
   */
  private hashForAssignment(userId: string, experimentId: string): number {
    const combined = `${userId}:${experimentId}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash * 31 + combined.charCodeAt(i)) % 100;
    }
    return hash;
  }

  /**
   * Record a conversion for an experiment
   */
  async recordConversion(
    context: RLSContext,
    experimentName: string,
    variantId: string,
    metric: string,
    value: number = 1
  ): Promise<void> {
    return withRLSContext(context, async (tx) => {
      const experiment = await tx.experiment.findFirst({
        where: { name: experimentName },
      });

      if (!experiment) {
        throw new Error("Experiment not found");
      }

      // Update or create result
      const existing = await tx.experimentResult.findFirst({
        where: {
          experimentId: experiment.id,
          variant: variantId,
          metric,
        },
      });

      if (existing) {
        await tx.experimentResult.update({
          where: { id: existing.id },
          data: {
            conversions: { increment: 1 },
            value: { increment: value },
          },
        });
      } else {
        await tx.experimentResult.create({
          data: {
            experimentId: experiment.id,
            variant: variantId,
            metric,
            participants: 1,
            conversions: 1,
            value,
          },
        });
      }
    });
  }

  /**
   * Get all experiments
   */
  async getExperiments(
    context: RLSContext,
    options?: PaginationOptions & { status?: ExperimentStatus }
  ): Promise<PaginatedResult<Experiment>> {
    const where: Prisma.ExperimentWhereInput = options?.status
      ? { status: options.status }
      : {};

    return this.findMany(context, {
      ...options,
      where,
      include: {
        results: true,
      },
    });
  }

  /**
   * Create a new experiment
   */
  async createExperiment(
    context: RLSContext,
    data: {
      name: string;
      description?: string;
      variants: ExperimentVariant[];
      targetAudience?: Record<string, unknown>;
      startDate?: Date;
      endDate?: Date;
      createdBy: string;
    }
  ): Promise<Experiment> {
    return withRLSContext(context, async (tx) => {
      return tx.experiment.create({
        data: {
          name: data.name,
          description: data.description,
          status: ExperimentStatus.draft,
          variants: data.variants as unknown as Prisma.JsonArray,
          targetAudience: data.targetAudience as
            | Prisma.InputJsonValue
            | undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          createdBy: data.createdBy,
        },
      });
    });
  }

  /**
   * Update experiment status
   */
  async updateStatus(
    context: RLSContext,
    experimentName: string,
    status: ExperimentStatus
  ): Promise<Experiment> {
    return withRLSContext(context, async (tx) => {
      return tx.experiment
        .updateMany({
          where: { name: experimentName },
          data: { status },
        })
        .then(() =>
          tx.experiment.findFirstOrThrow({
            where: { name: experimentName },
          })
        );
    });
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(
    context: RLSContext,
    experimentName: string
  ): Promise<{
    experiment: Experiment;
    results: ExperimentResult[];
    summary: Record<
      string,
      { participants: number; conversions: number; conversionRate: number }
    >;
  } | null> {
    return withRLSContext(context, async (tx) => {
      const experiment = await tx.experiment.findFirst({
        where: { name: experimentName },
        include: { results: true },
      });

      if (!experiment) return null;

      // Calculate summary per variant
      const summary: Record<
        string,
        { participants: number; conversions: number; conversionRate: number }
      > = {};

      for (const result of experiment.results) {
        if (!summary[result.variant]) {
          summary[result.variant] = {
            participants: 0,
            conversions: 0,
            conversionRate: 0,
          };
        }
        summary[result.variant].participants += result.participants;
        summary[result.variant].conversions += result.conversions;
      }

      // Calculate conversion rates
      for (const variant of Object.keys(summary)) {
        if (summary[variant].participants > 0) {
          summary[variant].conversionRate =
            (summary[variant].conversions / summary[variant].participants) *
            100;
        }
      }

      return {
        experiment,
        results: experiment.results,
        summary,
      };
    });
  }
}

// Export singleton instances
export const featureFlagService = new FeatureFlagService();
export const experimentService = new ExperimentService();

// Export classes for testing
export { FeatureFlagService, ExperimentService };
