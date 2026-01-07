import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

let bucket: any = null;
let firebaseEnabled = false;

// Initialize Firebase Admin if credentials are present and not already initialized
if (admin.apps.length === 0) {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_STORAGE_BUCKET,
  } = process.env;

  if (
    FIREBASE_PROJECT_ID &&
    FIREBASE_CLIENT_EMAIL &&
    FIREBASE_PRIVATE_KEY &&
    FIREBASE_STORAGE_BUCKET
  ) {
    try {
      const privateKey = (FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n").replace(/^"(.*)"$/, "$1");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket: FIREBASE_STORAGE_BUCKET,
      });
      bucket = admin.storage().bucket();
      firebaseEnabled = true;
    } catch (e: any) {
      console.warn(
        "Firebase initialization failed:",
        e && e.message ? e.message : e
      );
      firebaseEnabled = false;
    }
  } else {
    console.warn("Firebase credentials not set; Firebase Storage is disabled.");
  }
}

// Configure Cloudinary (used as a fallback / replacement for storage uploads)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file (Buffer) - uses Firebase Storage if configured, otherwise Cloudinary
 * @param file Buffer of the file to upload
 * @param destination Folder and filename in the bucket (used as public_id for Cloudinary if present)
 * @param contentType MIME type of the file
 */
export const uploadFile = async (
  file: Buffer,
  destination: string,
  contentType: string
): Promise<string> => {
  // If Firebase storage configured, keep using it
  if (firebaseEnabled && bucket) {
    const fileRef = bucket.file(destination);
    await fileRef.save(file, {
      metadata: {
        contentType,
        firebaseStorageDownloadTokens: uuidv4(),
      },
      public: true,
    });

    // Construct public URL
    return `https://storage.googleapis.com/${bucket.name}/${destination}`;
  }

  // Otherwise upload to Cloudinary
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "";
  const publicId = destination
    ? destination.replace(/\.[^.]+$/, "")
    : undefined;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
      },
      (error: any, result: any) => {
        if (error) return reject(error);
        if (!result || !result.secure_url)
          return reject(new Error("No upload URL returned"));
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(file).pipe(uploadStream);
  });
};

/**
 * Delete a file - uses Firebase Storage if configured, otherwise Cloudinary
 * @param fileUrl The public URL of the file
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (firebaseEnabled && bucket) {
    try {
      const parts = fileUrl.split("/");
      const filename = parts[parts.length - 1];
      const fileRef = bucket.file(filename);
      await fileRef.delete();
      return;
    } catch (error) {
      console.error("Error deleting file from Firebase:", error);
      return;
    }
  }

  // Otherwise attempt to delete from Cloudinary
  try {
    // Cloudinary URLs look like: https://res.cloudinary.com/<cloud_name>/image/upload/v123456/<public_id>.<ext>
    const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\./);
    const publicId = match ? match[1] : undefined;
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } else {
      console.warn("Could not extract Cloudinary public_id from URL:", fileUrl);
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
  }
};

export default {
  uploadFile,
  deleteFile,
};
