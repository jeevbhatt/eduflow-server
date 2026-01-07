import { Request, Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import notionService from "../services/notion.service";
import prisma from "../../../core/database/prisma";

export const connectNotion = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;

    if (!instituteId) {
      return res.status(400).json({ status: "error", message: "Institute ID required" });
    }

    const authUrl = notionService.getAuthUrl(instituteId);
    res.json({ url: authUrl });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const notionCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const instituteId = state as string;

    // Exchange code for tokens
    const tokens = await notionService.getTokensFromCode(code as string);

    // Save tokens to database
    await notionService.saveTokens(instituteId, tokens);

    // Redirect to frontend settings page
    res.redirect(`${process.env.FRONTEND_URL}/admin/settings/integrations?status=success&provider=notion`);
  } catch (error: any) {
    console.error("Notion OAuth Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/admin/settings/integrations?status=error&message=${encodeURIComponent(error.message)}`);
  }
};

export const getNotionStatus = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;

    if (!instituteId) {
      return res.status(400).json({ status: "error", message: "Institute ID required" });
    }

    const integration = await prisma.instituteIntegration.findUnique({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "notion",
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
      workspaceName: metadata?.workspaceName,
      workspaceIcon: metadata?.workspaceIcon,
      connectedAt: integration.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
