import { Router } from "express";
import { createInstitute } from "../controllers/createInstitute.controller";
import { getMyInstitutes } from "../controllers/getMyInstitutes.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

router.post("/", authenticate, createInstitute);
router.get("/my", authenticate, getMyInstitutes);

export default router;
