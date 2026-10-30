import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";
import { sendWebhookNotification } from "@/lib/notifications/webhook";
import { Booking } from "@/lib/data/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return unauthorizedResponse();
    if (session.role !== "Admin") {
      return forbiddenResponse();
    }

    const body = await req.json().catch(() => ({}));
    const customUrl = body.webhookUrl;

    const db = await getDb();
    if (customUrl) {
      await db.updateSetting("WEBHOOK_URL", customUrl);
    }

    const sampleBooking: Booking = {
      bookingId: `bk_test_${Date.now()}`,
      title: "ทดสอบการส่งการแจ้งเตือน Real-time Webhook",
      roomId: "room_01",
      roomName: "หอประชุมอดิเรกสาร",
      requesterPrefix: "นาย",
      bookedBy: session.name,
      position: "ผู้ดูแลระบบ",
      department: "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
      phoneNumber: "036-266-000",
      bookedByEmail: session.email,
      date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()),
      startTime: "09:00",
      endTime: "12:00",
      startDateTime: new Date().toISOString(),
      endDateTime: new Date().toISOString(),
      attendeesCount: 50,
      equipment: ["เครื่องฉายภาพ (Projector)", "ระบบเสียง", "ไมโครโฟน"],
      assetAgreementConfirmed: true,
      status: "Approved",
      inspectionInspector: "นายวัชรพงศ์ โสภา",
      inspectionStatus: "ready",
      endorserName: "นายเอกราช เขียวทอง",
      endorsementStatus: "endorsed",
      approvedBy: "นายชาตรี เริงชัยภูมิ",
      approvalStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await sendWebhookNotification(
      "booking_created",
      sampleBooking,
      "นี่คือข้อความทดสอบการเชื่อมต่อ Webhook จากระบบจองห้องประชุมออนไลน์"
    );

    if (res.success) {
      return NextResponse.json({
        success: true,
        message: "ส่งข้อความ Webhook เรียบร้อยแล้ว!",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: res.error || "ไม่สามารถส่ง Webhook ได้ กรุณาตรวจสอบ URL ปลายทาง",
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
