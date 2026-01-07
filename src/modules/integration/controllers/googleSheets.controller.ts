import { Request, Response } from "express";
import googleSheetsService from "../services/googleSheets.service";
import { IExtendedRequest } from "../../../core/middleware/type";

export const connectGoogleSheets = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(400).json({ status: "error", message: "Institute ID is required" });
    }

    const authUrl = googleSheetsService.getAuthUrl(instituteId);
    res.json({ url: authUrl });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const googleSheetsCallback = async (req: Request, res: Response) => {
  try {
    const { code, state: instituteId } = req.query;

    if (!code || !instituteId) {
      return res.status(400).send("Missing code or institute information");
    }

    const tokens = await googleSheetsService.getTokensFromCode(code as string);
    await googleSheetsService.saveTokens(instituteId as string, tokens);

    // Redirect back to frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/admin/settings/integrations?status=success&provider=google_sheets`);
  } catch (error: any) {
    console.error("Google Sheets Callback Error:", error.message);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/admin/settings/integrations?status=error&message=${encodeURIComponent(error.message)}`);
  }
};

export const getIntegrationStatus = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) {
      return res.status(400).json({ status: "error", message: "Institute ID is required" });
    }

    // In a real app, you might want a repository layer for this
    const integration = await require("../../../core/database/prisma").default.instituteIntegration.findUnique({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "google_sheets",
        },
      },
    });

    if (!integration) {
      return res.json({ status: "not_connected" });
    }

    res.json({
      status: integration.isActive ? "connected" : "disconnected",
      email: (integration.metadata as any)?.email,
      lastSync: integration.updatedAt,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
