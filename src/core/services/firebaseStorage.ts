import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

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
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
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

/**
 * Upload a file to Firebase Storage
 * @param file Buffer of the file to upload
 * @param destination Folder and filename in the bucket
 * @param contentType MIME type of the file
 */
export const uploadFile = async (
  file: Buffer,
  destination: string,
  contentType: string
): Promise<string> => {
  if (!firebaseEnabled || !bucket) {
    throw new Error(
      "Firebase Storage is not configured. Set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID and FIREBASE_STORAGE_BUCKET."
    );
  }

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
};

/**
 * Delete a file from Firebase Storage
 * @param fileUrl The public URL of the file
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!firebaseEnabled || !bucket) {
    console.warn(
      "Firebase Storage not configured; deleteFile ignored for:",
      fileUrl
    );
    return;
  }

  try {
    const parts = fileUrl.split("/");
    const filename = parts[parts.length - 1];
    const fileRef = bucket.file(filename);
    await fileRef.delete();
  } catch (error) {
    console.error("Error deleting file from Firebase:", error);
  }
};

export default {
  uploadFile,
  deleteFile,
};
