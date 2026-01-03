import { Router } from "express";
import { getAttendanceStats } from "../controllers/getAttendanceStats.controller";
import { getAssessmentPerformance } from "../controllers/getAssessmentPerformance.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

router.get("/attendance", authenticate, getAttendanceStats);
router.get("/performance/:courseId", authenticate, getAssessmentPerformance);

export default router;
