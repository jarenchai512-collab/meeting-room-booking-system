import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const db = await getDb();
  const fullUser = await db.getUserById(session.userId);

  return NextResponse.json({
    user: {
      userId: session.userId,
      username: session.username,
      name: fullUser?.name || session.name,
      email: fullUser?.email || session.email,
      department: fullUser?.department || session.department,
      role: fullUser?.role || session.role,
      position: fullUser?.position,
      phoneNumber: fullUser?.phoneNumber,
      prefix: fullUser?.prefix,
    },
  });
}
