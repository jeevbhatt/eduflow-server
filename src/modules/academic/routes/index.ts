import { Router } from "express";
import { authenticate } from "@core/middleware/authenticate";
import * as academicControllers from "../controllers";

const router = Router();

router.post("/assessment", authenticate, academicControllers.createAssessment);
router.get("/assessment/:courseId", authenticate, academicControllers.getAssessments);
router.post("/result", authenticate, academicControllers.submitResult);
router.get("/result/:assessmentId", authenticate, academicControllers.getResults);

export default router;
