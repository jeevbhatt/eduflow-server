/**
 * Library Routes (v2 - Prisma)
 *
 * Routes for digital library resources with RLS protection
 *
 * @module route/v2/libraryRoute
 */

import express, { Router } from "express";
import * as controller from "../../controller/v2/libraryController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, requireRole } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

// ============================================
// CATEGORY ROUTES
// ============================================

router
  .route("/categories")
  .get(isLoggedIn, asyncErrorHandler(controller.getCategories))
  .post(
    isLoggedIn,
    requireRole(UserRole.Institute, UserRole.Teacher),
    asyncErrorHandler(controller.createCategory)
  );

router
  .route("/categories/:categoryId")
  .put(
    isLoggedIn,
    requireRole(UserRole.Institute, UserRole.Teacher),
    asyncErrorHandler(controller.updateCategory)
  )
  .delete(
    isLoggedIn,
    requireRole(UserRole.Institute),
    asyncErrorHandler(controller.deleteCategory)
  );

// ============================================
// RESOURCE ROUTES
// ============================================

router.get(
  "/resources/popular",
  isLoggedIn,
  asyncErrorHandler(controller.getPopularResources)
);

router
  .route("/resources")
  .get(isLoggedIn, asyncErrorHandler(controller.getResources))
  .post(
    isLoggedIn,
    requireRole(UserRole.Institute, UserRole.Teacher),
    asyncErrorHandler(controller.createResource)
  );

router
  .route("/resources/:resourceId")
  .get(isLoggedIn, asyncErrorHandler(controller.getResource))
  .put(
    isLoggedIn,
    requireRole(UserRole.Institute, UserRole.Teacher),
    asyncErrorHandler(controller.updateResource)
  )
  .delete(
    isLoggedIn,
    requireRole(UserRole.Institute),
    asyncErrorHandler(controller.deleteResource)
  );

router.post(
  "/resources/:resourceId/download",
  isLoggedIn,
  asyncErrorHandler(controller.recordDownload)
);

router.post(
  "/resources/:resourceId/favorite",
  isLoggedIn,
  asyncErrorHandler(controller.toggleFavorite)
);

// ============================================
// BORROW ROUTES
// ============================================

router.get(
  "/borrows/my",
  isLoggedIn,
  asyncErrorHandler(controller.getMyBorrows)
);

router.get(
  "/borrows/overdue",
  isLoggedIn,
  requireRole(UserRole.Institute, UserRole.Teacher),
  asyncErrorHandler(controller.getOverdueBorrows)
);

router
  .route("/borrows")
  .post(isLoggedIn, asyncErrorHandler(controller.borrowResource));

router.post(
  "/borrows/:borrowId/return",
  isLoggedIn,
  asyncErrorHandler(controller.returnResource)
);

router.post(
  "/borrows/:borrowId/extend",
  isLoggedIn,
  asyncErrorHandler(controller.extendDueDate)
);

// ============================================
// FAVORITE ROUTES
// ============================================

router.get(
  "/favorites",
  isLoggedIn,
  asyncErrorHandler(controller.getMyFavorites)
);

export default router;
