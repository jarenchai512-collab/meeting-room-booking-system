import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  const db = await getDb();
  const notifications = await db.getNotifications(session.userId, session.role);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return NextResponse.json({ notifications, unreadCount });
}
