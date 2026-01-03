/**
 * Experiment Controller
 *
 * Handles HTTP requests for feature flags and A/B experiments
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/experimentController
 */

import { Response } from "express";
import { IExtendedRequest } from "../../middleware/type";
import {
  featureFlagService,
  experimentService,
  RLSContext,
} from "../../services/prisma";
import { ExperimentStatus } from "../../generated/prisma/client";

/**
 * Build RLS context from request
 */
const getRLSContext = (req: IExtendedRequest): RLSContext => ({
  userId: req.user?.id || "",
  userRole: req.user?.role || "student",
  instituteId: req.user?.currentInstituteId,
});

// ============================================
// FEATURE FLAG ENDPOINTS
// ============================================

/**
 * Check if a feature is enabled
 */
export const checkFeature = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;

    const isEnabled = await featureFlagService.isFeatureEnabled(context, key);

    res.status(200).json({
      message: "Feature flag checked",
      data: { name: key, isEnabled },
    });
  } catch (error: any) {
    console.error("Error checking feature flag:", error);
    res.status(500).json({
      message: "Error checking feature flag",
      error: error.message,
    });
  }
};

/**
 * Get all feature flags (admin only)
 */
export const getAllFlags = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { page = "1", limit = "20" } = req.query;

    const flags = await featureFlagService.getAllFlags(context, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Feature flags fetched successfully",
      ...flags,
    });
  } catch (error: any) {
    console.error("Error fetching feature flags:", error);
    res.status(500).json({
      message: "Error fetching feature flags",
      error: error.message,
    });
  }
};

/**
 * Create a feature flag
 */
export const createFlag = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { name, description, isEnabled, rolloutPercentage, conditions } =
      req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const flag = await featureFlagService.createFlag(context, {
      name,
      description,
      isEnabled,
      rolloutPercentage,
      conditions,
    });

    res.status(201).json({
      message: "Feature flag created successfully",
      data: flag,
    });
  } catch (error: any) {
    console.error("Error creating feature flag:", error);
    res.status(500).json({
      message: "Error creating feature flag",
      error: error.message,
    });
  }
};

/**
 * Toggle a feature flag
 */
export const toggleFlag = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;

    const flag = await featureFlagService.toggleFlag(context, key);

    res.status(200).json({
      message: "Feature flag toggled successfully",
      data: flag,
    });
  } catch (error: any) {
    console.error("Error toggling feature flag:", error);
    res.status(500).json({
      message: "Error toggling feature flag",
      error: error.message,
    });
  }
};

/**
 * Update rollout percentage
 */
export const updateRollout = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;
    const { percentage } = req.body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res
        .status(400)
        .json({ message: "Valid percentage (0-100) is required" });
    }

    const flag = await featureFlagService.updateRollout(
      context,
      key,
      percentage
    );

    res.status(200).json({
      message: "Rollout updated successfully",
      data: flag,
    });
  } catch (error: any) {
    console.error("Error updating rollout:", error);
    res.status(500).json({
      message: "Error updating rollout",
      error: error.message,
    });
  }
};

/**
 * Delete a feature flag
 */
export const deleteFlag = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;

    await featureFlagService.deleteFlag(context, key);

    res.status(200).json({
      message: "Feature flag deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting feature flag:", error);
    res.status(500).json({
      message: "Error deleting feature flag",
      error: error.message,
    });
  }
};

// ============================================
// EXPERIMENT ENDPOINTS
// ============================================

/**
 * Get variant for user
 */
export const getVariant = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;

    const variant = await experimentService.getVariantForUser(context, key);

    res.status(200).json({
      message: "Variant fetched",
      data: { experimentName: key, variant },
    });
  } catch (error: any) {
    console.error("Error fetching variant:", error);
    res.status(500).json({
      message: "Error fetching variant",
      error: error.message,
    });
  }
};

/**
 * Record a conversion
 */
export const recordConversion = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;
    const { variantId, metric, value } = req.body;

    if (!variantId || !metric) {
      return res.status(400).json({
        message: "Variant ID and metric are required",
      });
    }

    await experimentService.recordConversion(
      context,
      key,
      variantId,
      metric,
      value
    );

    res.status(200).json({
      message: "Conversion recorded successfully",
    });
  } catch (error: any) {
    console.error("Error recording conversion:", error);
    res.status(500).json({
      message: "Error recording conversion",
      error: error.message,
    });
  }
};

/**
 * Get experiments (admin only)
 */
export const getExperiments = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { status, page = "1", limit = "20" } = req.query;

    const experiments = await experimentService.getExperiments(context, {
      status: status as ExperimentStatus | undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Experiments fetched successfully",
      ...experiments,
    });
  } catch (error: any) {
    console.error("Error fetching experiments:", error);
    res.status(500).json({
      message: "Error fetching experiments",
      error: error.message,
    });
  }
};

/**
 * Create an experiment
 */
export const createExperiment = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { name, description, variants, targetAudience, startDate, endDate } =
      req.body;

    if (!name || !variants || variants.length < 2) {
      return res.status(400).json({
        message: "Name and at least 2 variants are required",
      });
    }

    // Validate total weights
    const totalWeight = variants.reduce(
      (sum: number, v: { weight: number }) => sum + v.weight,
      0
    );
    if (totalWeight !== 100) {
      return res.status(400).json({
        message: "Variant weights must sum to 100",
      });
    }

    const experiment = await experimentService.createExperiment(context, {
      name,
      description,
      variants,
      targetAudience,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      createdBy: userId!,
    });

    res.status(201).json({
      message: "Experiment created successfully",
      data: experiment,
    });
  } catch (error: any) {
    console.error("Error creating experiment:", error);
    res.status(500).json({
      message: "Error creating experiment",
      error: error.message,
    });
  }
};

/**
 * Update experiment status
 */
export const updateExperimentStatus = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const experiment = await experimentService.updateStatus(
      context,
      key,
      status as ExperimentStatus
    );

    res.status(200).json({
      message: "Experiment status updated successfully",
      data: experiment,
    });
  } catch (error: any) {
    console.error("Error updating experiment status:", error);
    res.status(500).json({
      message: "Error updating experiment status",
      error: error.message,
    });
  }
};

/**
 * Get experiment results
 */
export const getExperimentResults = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { key } = req.params;

    const results = await experimentService.getExperimentResults(context, key);

    if (!results) {
      return res.status(404).json({ message: "Experiment not found" });
    }

    res.status(200).json({
      message: "Experiment results fetched successfully",
      data: results,
    });
  } catch (error: any) {
    console.error("Error fetching experiment results:", error);
    res.status(500).json({
      message: "Error fetching experiment results",
      error: error.message,
    });
  }
};
