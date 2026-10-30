import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  const db = await getDb();
  const success = await db.markNotificationAsRead(params.id);

  return NextResponse.json({ success });
}
