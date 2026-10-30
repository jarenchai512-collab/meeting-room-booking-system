import { NextResponse } from "next/server";
import { getDb } from "@/lib/data/repository";

export async function GET() {
  const db = await getDb();
  const health = await db.checkHealth();
  const hasDriveConfig = Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID
  );

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: health,
    googleDrive: {
      configured: hasDriveConfig,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "not-set",
    },
    systemTimezone: process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Bangkok",
  });
}
