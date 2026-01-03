/**
 * Experiment Routes (v2)
 *
 * Routes for feature flags and A/B experiments with RLS protection
 *
 * @module route/v2/experimentRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/experimentController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, requireRole } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

// ============================================
// FEATURE FLAG ROUTES (PUBLIC)
// ============================================

router.get(
  "/flags/:key",
  isLoggedIn,
  asyncErrorHandler(controller.checkFeature)
);

// ============================================
// FEATURE FLAG ROUTES (ADMIN)
// ============================================

router
  .route("/flags")
  .get(
    isLoggedIn,
    requireRole(UserRole.SuperAdmin),
    asyncErrorHandler(controller.getAllFlags)
  )
  .post(
    isLoggedIn,
    requireRole(UserRole.SuperAdmin),
    asyncErrorHandler(controller.createFlag)
  );

router.post(
  "/flags/:key/toggle",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin),
  asyncErrorHandler(controller.toggleFlag)
);

router.post(
  "/flags/:key/rollout",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin),
  asyncErrorHandler(controller.updateRollout)
);

router.delete(
  "/flags/:key",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin),
  asyncErrorHandler(controller.deleteFlag)
);

// ============================================
// EXPERIMENT ROUTES (PUBLIC)
// ============================================

router.get(
  "/experiments/:key/variant",
  isLoggedIn,
  asyncErrorHandler(controller.getVariant)
);

router.post(
  "/experiments/:key/convert",
  isLoggedIn,
  asyncErrorHandler(controller.recordConversion)
);

// ============================================
// EXPERIMENT ROUTES (ADMIN)
// ============================================

router
  .route("/experiments")
  .get(
    isLoggedIn,
    requireRole(UserRole.SuperAdmin),
    asyncErrorHandler(controller.getExperiments)
  )
  .post(
    isLoggedIn,
    requireRole(UserRole.SuperAdmin),
    asyncErrorHandler(controller.createExperiment)
  );

router.put(
  "/experiments/:key/status",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin),
  asyncErrorHandler(controller.updateExperimentStatus)
);

router.get(
  "/experiments/:key/results",
  isLoggedIn,
  requireRole(UserRole.SuperAdmin),
  asyncErrorHandler(controller.getExperimentResults)
);

export default router;
