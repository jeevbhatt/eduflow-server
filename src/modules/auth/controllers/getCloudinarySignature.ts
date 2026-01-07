import { Request, Response } from "express";
// @ts-ignore
import { v2 as cloudinary } from "cloudinary";
import { authenticate } from "../../../core/middleware/authenticate";

// Ensure Cloudinary is configured (env vars should already be set in app startup)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getCloudinarySignature = async (req: Request, res: Response) => {
  try {
    // Timestamp in seconds
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = {
      timestamp,
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "fullstack-saas",
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET || ""
    );

    res.status(200).json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: paramsToSign.folder,
    });
  } catch (err) {
    console.error("[CLOUDINARY] Signature error:", err);
    res.status(500).json({ message: "Failed to generate signature" });
  }
};
