import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";

export async function GET() {
  try {
    const db = await getDb();
    const settings = await db.getSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorizedResponse();
    if (session.role !== "Admin") {
      return forbiddenResponse("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขการตั้งค่าได้");
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "ต้องระบุ settingKey" }, { status: 400 });
    }

    const db = await getDb();
    const updated = await db.updateSetting(key, String(value || ""));
    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
