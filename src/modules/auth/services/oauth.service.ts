import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export class OAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
  }

  /**
   * Verified a Google ID Token (credential) and returns the payload.
   * Based on modern Google Identity Services (GIS) standards for 2026.
   */
  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error("Invalid Google token payload");
      }

      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        googleId: payload.sub,
        emailVerified: payload.email_verified,
      };
    } catch (error: any) {
      console.error("Google Token Verification Error:", error.message);
      throw new Error("Failed to verify Google Token: " + error.message);
    }
  }

  /**
   * Exchanges a Google Authorization Code for Tokens (Access + ID Token).
   * This is the secure "Authorization Code Flow".
   */
  async verifyGoogleCode(code: string) {
    try {
      const { tokens } = await this.client.getToken(code);
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error("Invalid Google token payload");
      }

      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        googleId: payload.sub,
        emailVerified: payload.email_verified,
      };
    } catch (error: any) {
      console.error("Google Code Exchange Error:", error.message);
      throw new Error("Failed to exchange Google Code: " + error.message);
    }
  }
}

export default new OAuthService();
