import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

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
