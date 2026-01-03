import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getProfile } from "../controllers/getProfile.controller";
import { updateProfile } from "../controllers/updateProfile.controller";
import { getInstituteTeachers } from "../controllers/getInstituteTeachers.controller";

const router = Router();

router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.get("/institute/all", authenticate, getInstituteTeachers);

export default router;
