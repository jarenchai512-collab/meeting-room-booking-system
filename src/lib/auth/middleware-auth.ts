import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken, TokenPayload } from "./jwt";

export async function getSessionUser(req: NextRequest): Promise<TokenPayload | null> {
  // 1. Check Cookie
  const tokenCookie = req.cookies.get("auth_token")?.value;
  if (tokenCookie) {
    const payload = await verifyUserToken(tokenCookie);
    if (payload) return payload;
  }

  // 2. Check Authorization Header (Bearer <token>)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7);
    const payload = await verifyUserToken(bearerToken);
    if (payload) return payload;
  }

  return null;
}

export function unauthorizedResponse(message: string = "กรุณาเข้าสู่ระบบก่อนทำรายการ") {
  return NextResponse.json({ error: message, code: "UNAUTHORIZED" }, { status: 401 });
}

export function forbiddenResponse(message: string = "คุณไม่มีสิทธิ์ในการทำรายการนี้") {
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
}
