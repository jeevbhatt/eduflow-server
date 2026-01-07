import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import prisma from "../../../core/database/prisma";

export class GoogleSheetsService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_SHEETS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_SHEETS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_SHEETS_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generates the Auth URL for Google Sheets
   */
  getAuthUrl(instituteId: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      state: instituteId,
      prompt: "consent", // Force to get refresh token
    });
  }

  /**
   * Exchanges authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Stores or updates tokens for an institute
   */
  async saveTokens(instituteId: string, tokens: any) {
    const { access_token, refresh_token, expiry_date, scope, token_type } = tokens;

    // Get user email from Google to store in metadata
    this.oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    return await prisma.instituteIntegration.upsert({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "google_sheets",
        },
      },
      update: {
        accessToken: access_token,
        ...(refresh_token && { refreshToken: refresh_token }),
        expiryDate: expiry_date ? new Date(expiry_date) : null,
        scope,
        tokenType: token_type,
        metadata: {
          email: userInfo.data.email,
          name: userInfo.data.name,
          updatedAt: new Date().toISOString(),
        },
        isActive: true,
      },
      create: {
        instituteId,
        provider: "google_sheets",
        accessToken: access_token,
        refreshToken: refresh_token,
        expiryDate: expiry_date ? new Date(expiry_date) : null,
        scope,
        tokenType: token_type,
        metadata: {
          email: userInfo.data.email,
          name: userInfo.data.name,
          connectedAt: new Date().toISOString(),
        },
        isActive: true,
      },
    });
  }

  /**
   * Gets authenticated client for an institute
   */
  async getAuthenticatedClient(instituteId: string) {
    const integration = await prisma.instituteIntegration.findUnique({
      where: {
        instituteId_provider: {
          instituteId,
          provider: "google_sheets",
        },
      },
    });

    if (!integration || !integration.isActive) {
      throw new Error("Google Sheets integration not found or inactive for this institute");
    }

    this.oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken || undefined,
      expiry_date: integration.expiryDate ? integration.expiryDate.getTime() : undefined,
    });

    // Refresh token if expired
    this.oauth2Client.on("tokens", async (tokens) => {
      if (tokens.refresh_token) {
        // Handle explicit refresh token update if needed
      }
      await prisma.instituteIntegration.update({
        where: { id: integration.id },
        data: {
          accessToken: tokens.access_token!,
          expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });
    });

    return this.oauth2Client;
  }

  /**
   * Creates a new spreadsheet
   */
  async createSpreadsheet(instituteId: string, title: string) {
    const auth = await this.getAuthenticatedClient(instituteId);
    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    });

    return response.data;
  }

  /**
   * Appends rows to a sheet
   */
  async appendRows(instituteId: string, spreadsheetId: string, range: string, values: any[][]) {
    const auth = await this.getAuthenticatedClient(instituteId);
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });
  }
}

export default new GoogleSheetsService();
