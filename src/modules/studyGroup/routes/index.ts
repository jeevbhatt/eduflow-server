import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { createGroup } from "../controllers/createGroup.controller";
import { getGroups } from "../controllers/getGroups.controller";
import { getUserGroups } from "../controllers/getUserGroups.controller";
import { joinGroup } from "../controllers/joinGroup.controller";
import { leaveGroup } from "../controllers/leaveGroup.controller";
import { createSession } from "../controllers/createSession.controller";
import { getGroupSessions } from "../controllers/getGroupSessions.controller";

const router = Router();

// Group Routes
router.get("/", authenticate, getGroups);
router.post("/", authenticate, createGroup);
router.get("/my", authenticate, getUserGroups);
router.post("/join/:groupId", authenticate, joinGroup);
router.post("/leave/:groupId", authenticate, leaveGroup);

// Session Routes
router.get("/:groupId/sessions", authenticate, getGroupSessions);
router.post("/:groupId/sessions", authenticate, createSession);

export default router;
