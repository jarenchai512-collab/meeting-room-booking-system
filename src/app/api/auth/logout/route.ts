import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/middleware-auth";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (user) {
    await logAuditEvent({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: "USER_LOGOUT",
      entityType: "User",
      entityId: user.userId,
      details: "User logged out",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });
  }

  const response = NextResponse.json({ success: true, message: "ออกจากระบบเรียบร้อย" });
  response.cookies.delete("auth_token");
  return response;
}
