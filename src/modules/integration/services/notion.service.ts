import axios from "axios";
import prisma from "../../../core/database/prisma";

export class NotionService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor() {
    this.clientId = process.env.NOTION_CLIENT_ID || "";
    this.clientSecret = process.env.NOTION_CLIENT_SECRET || "";
    this.redirectUri = process.env.NOTION_REDIRECT_URI || "";

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn("Notion credentials not set completely in environment variables.");
    }
  }

  /**
   * Generates the Auth URL for Notion
   */
  getAuthUrl(instituteId: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      owner: "user",
      redirect_uri: this.redirectUri,
      state: instituteId,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  }

  /**
   * Stores or updates tokens for an institute
   */
  async saveTokens(instituteId: string, tokenData: any) {
    // Notion response structure:
    // {
    //   "access_token": "...",
    //   "bot_id": "...",
    //   "duplicating_user": { ... },
    //   "workspace_icon": "...",
    //   "workspace_id": "...",
    //   "workspace_name": "...",
    //   "owner": { ... }
    // }

    const {
      access_token,
      bot_id,
      workspace_id,
      workspace_name,
      workspace_icon,
      owner,
    } = tokenData;

    return await prisma.instituteIntegration.upsert({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "notion",
        },
      },
      update: {
        accessToken: access_token,
        // Notion access tokens don't expire usually, so no refresh token or expiry needed
        metadata: {
          botId: bot_id,
          workspaceId: workspace_id,
          workspaceName: workspace_name,
          workspaceIcon: workspace_icon,
          ownerObject: owner,
          updatedAt: new Date().toISOString(),
        },
        isActive: true,
      },
      create: {
        instituteId,
        provider: "notion",
        accessToken: access_token,
        metadata: {
          botId: bot_id,
          workspaceId: workspace_id,
          workspaceName: workspace_name,
          workspaceIcon: workspace_icon,
          ownerObject: owner,
          connectedAt: new Date().toISOString(),
        },
        isActive: true,
      },
    });
  }

  /**
   * Gets authenticated client details (token)
   */
  async getIntegration(instituteId: string) {
    return await prisma.instituteIntegration.findUnique({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "notion",
        },
      },
    });
  }
}

export default new NotionService();
