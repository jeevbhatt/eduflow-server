import { Request, Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import googleMeetService from "../services/googleMeet.service";
import prisma from "../../../core/database/prisma";

export const connectGoogleMeet = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;

    if (!instituteId) {
      return res.status(400).json({ status: "error", message: "Institute ID required" });
    }

    const authUrl = googleMeetService.getAuthUrl(instituteId);
    res.json({ url: authUrl });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const googleMeetCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const instituteId = state as string;

    // Exchange code for tokens
    const tokens = await googleMeetService.getTokensFromCode(code as string);

    // Save tokens to database
    await googleMeetService.saveTokens(instituteId, tokens);

    // Redirect to frontend settings page
    res.redirect(`${process.env.FRONTEND_URL}/admin/settings/integrations?status=success&provider=google_meet`);
  } catch (error: any) {
    console.error("Google Meet OAuth Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/admin/settings/integrations?status=error&message=${encodeURIComponent(error.message)}`);
  }
};

export const getGoogleMeetStatus = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;

    if (!instituteId) {
      return res.status(400).json({ status: "error", message: "Institute ID required" });
    }

    const integration = await prisma.instituteIntegration.findUnique({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "google_meet",
        },
      },
    });

    if (!integration || !integration.isActive) {
      return res.json({ connected: false });
    }

    // Safely cast metadata
    const metadata = integration.metadata as any;

    res.json({
      connected: true,
      email: metadata?.email,
      name: metadata?.name,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
