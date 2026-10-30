/**
 * Automated Google Sheets Setup Script
 * Creates required worksheets and canonical headers if they don't already exist.
 * Preserves all existing data.
 *
 * Usage:
 *   npm run setup:sheets
 */

import { sheets as googleSheets } from "@googleapis/sheets";
import { JWT } from "google-auth-library";
import fs from "fs";
import path from "path";

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.error("❌ Error: Missing Google Sheets configuration in environment variables.");
  console.error("Please set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in .env.local");
  process.exit(1);
}

const SCHEMA_DEFINITIONS = {
  Bookings: [
    "bookingId",
    "title",
    "roomId",
    "roomName",
    "bookedBy",
    "bookedByEmail",
    "department",
    "date",
    "startTime",
    "endTime",
    "startDateTime",
    "endDateTime",
    "attendeesCount",
    "purpose",
    "equipment",
    "notes",
    "fileAttachmentUrl",
    "fileAttachmentId",
    "fileName",
    "status",
    "rejectionReason",
    "approvedBy",
    "approvedAt",
    "idempotencyKey",
    "createdAt",
    "updatedAt",
  ],
  Rooms: [
    "roomId",
    "name",
    "building",
    "floor",
    "capacity",
    "equipmentList",
    "isAvailable",
    "color",
    "description",
    "imageUrl",
    "createdAt",
    "updatedAt",
  ],
  Users: [
    "userId",
    "username",
    "passwordHash",
    "name",
    "email",
    "department",
    "role",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  Notifications: [
    "notificationId",
    "recipientUserId",
    "recipientRole",
    "title",
    "message",
    "type",
    "bookingId",
    "isRead",
    "createdAt",
  ],
  AuditLogs: [
    "logId",
    "timestamp",
    "userId",
    "userName",
    "userRole",
    "action",
    "entityType",
    "entityId",
    "details",
    "ipAddress",
  ],
  Settings: [
    "settingKey",
    "settingValue",
    "description",
    "updatedAt",
  ],
};

async function main() {
  console.log("🚀 Connecting to Google Sheets API...");
  const auth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = googleSheets({ version: "v4", auth });

  console.log(`📋 Fetching Spreadsheet metadata for ID: ${SHEET_ID}...`);
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = meta.data.sheets?.map((s) => s.properties?.title) || [];
  console.log(`Current worksheets found: ${existingSheets.join(", ") || "(none)"}`);

  // 1. Create missing sheets
  const addSheetRequests = [];
  for (const sheetName of Object.keys(SCHEMA_DEFINITIONS)) {
    if (!existingSheets.includes(sheetName)) {
      console.log(`➕ Queuing creation of sheet: "${sheetName}"`);
      addSheetRequests.push({
        addSheet: {
          properties: {
            title: sheetName,
            gridProperties: { rowCount: 1000, columnCount: 30 },
          },
        },
      });
    }
  }

  if (addSheetRequests.length > 0) {
    console.log(`🛠️ Creating ${addSheetRequests.length} missing sheet tabs...`);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests: addSheetRequests },
    });
    console.log("✅ Missing sheets created successfully!");
  } else {
    console.log("✅ All required sheets already exist.");
  }

  // 2. Set headers for each sheet without overwriting existing data rows
  for (const [sheetName, headers] of Object.entries(SCHEMA_DEFINITIONS)) {
    const existingVal = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });

    const currentHeaderRow = existingVal.data.values?.[0] || [];
    if (currentHeaderRow.length === 0) {
      console.log(`📝 Writing header row for sheet: "${sheetName}"...`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers],
        },
      });
      console.log(`✅ Header row written for "${sheetName}"`);
    } else {
      console.log(`ℹ️ Headers already present in "${sheetName}", skipping to protect data.`);
    }
  }

  console.log("\n🎉 Google Sheets initialization complete! All 6 worksheets are ready.");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
