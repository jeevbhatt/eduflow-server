import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getNotifications } from "../controllers/getNotifications.controller";
import { markAsRead } from "../controllers/markAsRead.controller";
import { getUnreadCount } from "../controllers/getUnreadCount.controller";

const router = Router();

router.get("/", authenticate, getNotifications);
router.post("/read", authenticate, markAsRead);
router.get("/unread-count", authenticate, getUnreadCount);

export default router;
