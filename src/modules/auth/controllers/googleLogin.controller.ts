import { Request, Response } from "express";
import oauthService from "../services/oauth.service";
import authService from "../services/auth.service";
import authRepo from "../repository/auth.repo";

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential, code } = req.body;

    let googleUser;

    if (code) {
      // Authorization Code Flow (Secure)
      googleUser = await oauthService.verifyGoogleCode(code);
    } else if (credential) {
      // Legacy/Implicit Flow (ID Token)
      googleUser = await oauthService.verifyGoogleToken(credential);
    } else {
      return res.status(400).json({ status: "error", message: "Missing Google code or credential" });
    }

    // Find or create user in our database
    let user = await authRepo.findByEmail(googleUser.email!);

    if (!user) {
      // Create a user if they don't exist
      // Note: In a real scenario, you might want to handle role assignment or institute linking here
      user = await authRepo.create({
        email: googleUser.email!,
        password: "", // No password for OAuth users
        firstName: googleUser.firstName || "",
        lastName: googleUser.lastName || "",
        role: "student", // Default role
        isVerified: googleUser.emailVerified || false,
      });
    }

    const { accessToken, refreshToken } = await authService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Standardize cookie name for client-side proxy (Next.js)
    res.cookie("eduflow_auth_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 mins (match access token)
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      status: "success",
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        accessToken,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      status: "error",
      message: error.message,
    });
  }
};
