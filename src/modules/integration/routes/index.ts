import { Router } from "express";
import { connectGoogleSheets, googleSheetsCallback, getIntegrationStatus } from "../controllers/googleSheets.controller";
import { syncDataToSheet } from "../controllers/googleSheetsSync.controller";
import { connectNotion, notionCallback, getNotionStatus } from "../controllers/notion.controller";
import { connectGoogleMeet, googleMeetCallback, getGoogleMeetStatus } from "../controllers/googleMeet.controller";
import { authenticate } from "../../../core/middleware/authenticate";

const router = Router();

// OAuth flow
router.get("/google-sheets/connect", authenticate, connectGoogleSheets);
router.get("/google-sheets/callback", googleSheetsCallback); // Public callback to be called by Google

// Status
router.get("/google-sheets/status", authenticate, getIntegrationStatus);
// Google Meet
router.get("/google-meet/connect", authenticate, connectGoogleMeet);
router.get("/google-meet/callback", googleMeetCallback);
router.get("/google-meet/status", authenticate, getGoogleMeetStatus);

// Notion
router.get("/notion/connect", authenticate, connectNotion);
router.get("/notion/callback", notionCallback);
router.get("/notion/status", authenticate, getNotionStatus);

export default router;
