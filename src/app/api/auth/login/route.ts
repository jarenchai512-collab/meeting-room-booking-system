import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/data/repository";
import { comparePassword, signUserToken } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db.getUserByUsername(username);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" },
        { status: 401 }
      );
    }

    // Verify password if hash exists
    if (user.passwordHash) {
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
          { status: 401 }
        );
      }
    }

    const token = await signUserToken(user);

    // Audit log
    await logAuditEvent({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.userId,
      details: `User ${user.username} logged in successfully`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        position: user.position,
        phoneNumber: user.phoneNumber,
        prefix: user.prefix,
      },
      token,
    });

    // Set HTTP-Only Cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + err?.message },
      { status: 500 }
    );
  }
}
