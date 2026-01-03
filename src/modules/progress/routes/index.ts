import { Router } from "express";
import { authenticate } from "@core/middleware/authenticate";
import * as progressControllers from "../controllers";

const router = Router();

router.post("/update", authenticate, progressControllers.updateProgress);
router.get("/:courseId", authenticate, progressControllers.getProgress);
router.get("/achievements/my", authenticate, progressControllers.getAchievements);

export default router;
