import { drive as googleDrive } from "@googleapis/drive";
import { JWT } from "google-auth-library";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  fileId: string;
  fileUrl: string;
  fileName: string;
  provider: "google_drive" | "local_storage";
}

export async function uploadBookingAttachment(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  // 1. Validation
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("ขนาดไฟล์เกินขีดจำกัด 10MB");
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `ชนิดไฟล์ไม่รองรับ (${mimeType}) อนุญาตเฉพาะ PDF, Office docs, Text และรูปภาพเท่านั้น`
    );
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // 2. Google Drive Upload if credentials present
  if (clientEmail && privateKey && folderId) {
    try {
      const auth = new JWT({
        email: clientEmail,
        key: privateKey.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/drive.file"],
      });

      const drive = googleDrive({ version: "v3", auth });

      const stream = Readable.from(fileBuffer);
      const fileMetadata = {
        name: `${Date.now()}_${fileName}`,
        parents: [folderId],
      };

      const media = {
        mimeType,
        body: stream,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, name, webViewLink",
      });

      const fileId = response.data.id || "";
      const fileUrl =
        response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

      return {
        fileId,
        fileUrl,
        fileName,
        provider: "google_drive",
      };
    } catch (err: any) {
      console.warn("Google Drive upload failed, falling back to local storage:", err?.message);
    }
  }

  // 3. Fallback to Local Storage (public/uploads)
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const localFileName = `${Date.now()}_${sanitized}`;
  const localPath = path.join(uploadsDir, localFileName);

  fs.writeFileSync(localPath, fileBuffer);

  return {
    fileId: `local_${Date.now()}`,
    fileUrl: `/uploads/${localFileName}`,
    fileName,
    provider: "local_storage",
  };
}
