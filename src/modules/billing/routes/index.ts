import { Router } from "express";
import { authenticate } from "@core/middleware/authenticate";
import { paymentLimiter } from "@core/middleware/rateLimiter";
import * as billingControllers from "../controllers";

const router = Router();

router.post("/cart", authenticate, billingControllers.addToCart);
router.get("/cart", authenticate, billingControllers.getCart);
router.post("/order", authenticate, paymentLimiter, billingControllers.createOrder);
router.get("/order", authenticate, billingControllers.getOrders);

export default router;
