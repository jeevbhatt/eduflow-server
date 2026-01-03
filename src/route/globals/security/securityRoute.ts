import express from "express";
import { SecurityController } from "../../../controller/globals/security/securityController";
import { isLoggedIn } from "../../../middleware/middleware";

const router = express.Router();

router.get("/logs", isLoggedIn, SecurityController.getAuditLogs);
router.delete("/logs", isLoggedIn, SecurityController.clearAuditLogs);

export default router;
