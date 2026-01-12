import { Router } from "express";
import { createInstitute } from "../controllers/createInstitute.controller";
import { getMyInstitutes } from "../controllers/getMyInstitutes.controller";
import { updateSubdomain } from "../controllers/updateSubdomain.controller";
import { getInstituteBySlug } from "../controllers/getInstituteBySlug.controller";
import { authenticate } from "../../../core/middleware/authenticate";
import { registrationLimiter } from "../../../core/middleware/rateLimiter";

const router = Router();

router.get("/slug/:slug", getInstituteBySlug);
router.post("/", authenticate, registrationLimiter, createInstitute);
router.get("/my", authenticate, getMyInstitutes);
router.post("/:id/subdomain", authenticate, updateSubdomain);

export default router;
