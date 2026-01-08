import { Router } from "express";
import { login, logout, googleLogin, register } from "../controllers";
import { getCloudinarySignature } from "../controllers/getCloudinarySignature";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/google-login", googleLogin);

router.post("/logout", logout);

// Cloudinary signature endpoint (authenticated)
router.get("/cloudinary-sign", authenticate, getCloudinarySignature);

export default router;
