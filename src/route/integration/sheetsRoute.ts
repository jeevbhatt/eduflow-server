import express from "express";
import { Router } from "express";
import GoogleSheetsController from "../../controller/integration/googleSheetsController";
import { saveCredentials, getCredentials, deleteCredentials } from "../../controller/integration/integrationController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn } from "../../middleware/middleware";

const router: Router = express.Router();

// OAuth & Connection
router.route("/connect")
    .post(isLoggedIn, asyncErrorHandler(GoogleSheetsController.exchangeCode));

// Credentials management
router.route("/credentials/:provider")
    .get(isLoggedIn, asyncErrorHandler(getCredentials))
    .delete(isLoggedIn, asyncErrorHandler(deleteCredentials));

router.route("/credentials")
    .post(isLoggedIn, asyncErrorHandler(saveCredentials));

// Export endpoints
router.route("/export/students")
    .post(isLoggedIn, asyncErrorHandler(GoogleSheetsController.exportStudents));

router.route("/export/attendance")
    .post(isLoggedIn, asyncErrorHandler(GoogleSheetsController.exportAttendance));

router.route("/export/results")
    .post(isLoggedIn, asyncErrorHandler(GoogleSheetsController.exportResults));

// Import endpoints
router.route("/import/students")
    .post(isLoggedIn, asyncErrorHandler(GoogleSheetsController.importStudents));

// Sync status
router.route("/status")
    .get(isLoggedIn, asyncErrorHandler(GoogleSheetsController.getSyncStatus));

export default router;
