import { Router } from "express";
import { createInstitute } from "../controllers/createInstitute.controller";
import { getMyInstitutes } from "../controllers/getMyInstitutes.controller";
import { updateSubdomain } from "../controllers/updateSubdomain.controller";
import { getInstituteBySlug } from "../controllers/getInstituteBySlug.controller";
import { getAllInstitutes } from "../controllers/getAllInstitutes.controller";
import {
  getPublicInstitutes,
  requestJoinInstitute,
  getMyJoinRequests,
  getInstituteJoinRequests,
  reviewJoinRequest,
} from "../controllers/joinRequest.controller";
import { searchInstitutes } from "../controllers/searchInstitutes.controller";
import { authenticate } from "../../../core/middleware/authenticate";
import { registrationLimiter, joinRequestLimiter } from "../../../core/middleware/rateLimiter";

const router = Router();

// Public routes
router.get("/public", getPublicInstitutes);
router.get("/search", searchInstitutes);
router.get("/slug/:slug", getInstituteBySlug);

// Admin routes (super admin only)
router.get("/admin/all", authenticate, getAllInstitutes);

// Authenticated routes
router.post("/", authenticate, registrationLimiter, createInstitute);
router.get("/my", authenticate, getMyInstitutes);
router.post("/:id/subdomain", authenticate, updateSubdomain);

// Join request routes
router.get("/my-requests", authenticate, getMyJoinRequests);
router.post("/:id/join", authenticate, joinRequestLimiter, requestJoinInstitute);
router.get("/:id/requests", authenticate, getInstituteJoinRequests);
router.patch("/requests/:id", authenticate, reviewJoinRequest);

export default router;
