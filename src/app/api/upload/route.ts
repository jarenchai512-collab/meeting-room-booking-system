import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth/middleware-auth";
import { uploadBookingAttachment } from "@/lib/data/google-drive";

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่ต้องการอัปโหลด" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBookingAttachment(
      buffer,
      file.name,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({
      success: true,
      fileUrl: result.fileUrl,
      fileId: result.fileId,
      fileName: result.fileName,
      provider: result.provider,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err?.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" },
      { status: 400 }
    );
  }
}
