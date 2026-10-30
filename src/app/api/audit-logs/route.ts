import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();
  if (session.role !== "Admin") {
    return forbiddenResponse("เฉพาะ Admin เท่านั้นที่สามารถดู Audit Logs ได้");
  }

  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : 100;

  const db = await getDb();
  const logs = await db.getAuditLogs(limit);

  return NextResponse.json({ logs });
}
