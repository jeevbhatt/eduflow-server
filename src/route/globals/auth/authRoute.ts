import * as express from "express"
import { Router } from "express"
import AuthController from "../../../controller/globals/auth/authController"
import OAuthController from "../../../controller/globals/auth/oauthController"
import VerificationController from "../../../controller/globals/auth/verificationController"
import asyncErrorHandler from "../../../services/asyncErrorHandler"
import { isLoggedIn } from "../../../middleware/middleware"
import upload from "../../../middleware/multerUpload"
import { validate, authSchemas } from "../../../services/validationService"

const router: Router = express.Router();

// ============================================
// PUBLIC AUTH ROUTES
// ============================================
router.route("/register").post(
  validate(authSchemas.register),
  asyncErrorHandler(AuthController.registerUser)
);

router.route("/login").post(
  validate(authSchemas.login),
  asyncErrorHandler(AuthController.loginUser)
);

router.route("/refresh").post(
  validate(authSchemas.refreshToken),
  asyncErrorHandler(AuthController.refreshToken)
);

router.route("/logout").post(asyncErrorHandler(AuthController.logout));

// ============================================
// EMAIL/PHONE VERIFICATION (Public & Protected)
// ============================================
// Public - Email OTP (for Vercel-style flow)
router.route("/send-otp").post(
  validate(authSchemas.sendOtp),
  asyncErrorHandler(VerificationController.sendEmailOTP)
);

router.route("/verify-otp").post(
  validate(authSchemas.verifyOtp),
  asyncErrorHandler(VerificationController.verifyEmailOTP)
);

router.route("/resend-otp").post(
  validate(authSchemas.sendOtp),
  asyncErrorHandler(VerificationController.resendOTP)
);

router.route("/verification-status").get(asyncErrorHandler(VerificationController.checkVerificationStatus));

// Protected - Phone OTP (requires login)
router.route("/send-phone-otp").post(isLoggedIn, asyncErrorHandler(VerificationController.sendPhoneOTP));
router.route("/verify-phone-otp").post(isLoggedIn, asyncErrorHandler(VerificationController.verifyPhoneOTP));

// ============================================
// MFA ROUTES
// ============================================
router.route("/mfa-setup").get(isLoggedIn, asyncErrorHandler(AuthController.setupMfa));

router.route("/mfa-verify").post(
  isLoggedIn,
  validate(authSchemas.mfaVerify),
  asyncErrorHandler(AuthController.verifyAndEnableMfa)
);

router.route("/mfa-finalize").post(
  validate(authSchemas.mfaFinalize),
  asyncErrorHandler(AuthController.finalizeMfaLogin)
);

router.route("/mfa-disable").post(
  isLoggedIn,
  validate(authSchemas.mfaVerify),
  asyncErrorHandler(AuthController.disableMfa)
);

// ============================================
// PROFILE ROUTES
// ============================================
router.route("/profile")
    .get(isLoggedIn, asyncErrorHandler(AuthController.getProfile))
    .put(isLoggedIn, validate(authSchemas.updateProfile), asyncErrorHandler(AuthController.updateProfile));

router.route("/profile/image")
    .post(isLoggedIn, upload.single('profileImage'), asyncErrorHandler(AuthController.uploadProfileImage));

// ============================================
// OAUTH ROUTES (Token-based for SPA/Mobile)
// ============================================
router.route("/google/token").post(asyncErrorHandler(OAuthController.googleTokenAuth));
router.route("/microsoft/token").post(asyncErrorHandler(OAuthController.microsoftTokenAuth));

export default router;
