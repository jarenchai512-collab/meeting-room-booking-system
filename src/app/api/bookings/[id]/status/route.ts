import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";
import { canApproveOrReject } from "@/lib/auth/permissions";
import { eventHub } from "@/lib/events/event-emitter";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { sendWebhookNotification } from "@/lib/notifications/webhook";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  const body = await req.json();
  const {
    stage, // "inspection" | "endorsement" | "approval" | undefined
    status, // "Approved" | "Rejected" | "Cancelled" | "Inspected" | "Endorsed"
    inspectionStatus, // "ready" | "not_ready"
    inspectionNote,
    endorsementStatus, // "endorsed" | "rejected"
    endorsementNote,
    rejectionReason,
  } = body;

  const db = await getDb();
  const booking = await db.getBookingById(params.id);
  if (!booking) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 });
  }

  // Permission check
  if (!canApproveOrReject(session.role)) {
    return forbiddenResponse("คุณไม่มีสิทธิ์ในการจัดการสถานะหรืออนุมัติคำขอนี้");
  }

  const nowIso = new Date().toISOString();
  const thaiDateStr = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const updates: any = {
    updatedAt: nowIso,
  };

  let webhookEvent: any = "booking_approved";
  let message = "";

  // 1. Stage 1: ตรวจสอบความพร้อมห้อง (นายวัชรพงศ์ โสภา)
  if (stage === "inspection" || inspectionStatus) {
    updates.inspectionInspector = session.name || "นายวัชรพงศ์ โสภา";
    updates.inspectionStatus = inspectionStatus; // "ready" | "not_ready"
    updates.inspectionNote = inspectionNote || (inspectionStatus === "ready" ? "ห้องพร้อมใช้งาน อุปกรณ์ครบถ้วน" : "ห้องไม่พร้อมใช้งาน");
    updates.inspectionDate = thaiDateStr;

    if (inspectionStatus === "ready") {
      updates.status = "Inspected";
      webhookEvent = "room_inspected";
      message = "บันทึกผลการตรวจสอบห้องเรียบร้อย (พร้อมใช้งาน) ส่งต่อหัวหน้างานรับรอง";
    } else {
      updates.status = "Rejected";
      updates.rejectionReason = `ห้องไม่พร้อมใช้งาน: ${updates.inspectionNote}`;
      webhookEvent = "booking_rejected";
      message = "บันทึกผลการตรวจสอบห้อง: ไม่พร้อมใช้งาน (ปฏิเสธคำขอ)";
    }
  }
  // 2. Stage 2: รับรองคำขอ (นายเอกราช เขียวทอง)
  else if (stage === "endorsement" || endorsementStatus) {
    updates.endorserName = session.name || "นายเอกราช เขียวทอง";
    updates.endorsementStatus = endorsementStatus;
    updates.endorsementNote = endorsementNote || "เห็นควรอนุญาตตามที่ขอ";
    updates.endorsementDate = thaiDateStr;

    if (endorsementStatus === "endorsed") {
      updates.status = "Endorsed";
      webhookEvent = "booking_endorsed";
      message = "ลงนามรับรองคำขอเรียบร้อย ส่งต่อรองผู้อำนวยการพิจารณาอนุมัติ";
    } else {
      updates.status = "Rejected";
      updates.rejectionReason = `หัวหน้างานไม่รับรองคำขอ: ${endorsementNote || "ไม่เป็นไปตามระเบียบ"}`;
      webhookEvent = "booking_rejected";
      message = "บันทึกไม่รับรองคำขอ (ปฏิเสธคำขอ)";
    }
  }
  // 3. Stage 3: พิจารณาอนุมัติ (นายชาตรี เริงชัยภูมิ) หรือ direct status
  else {
    const finalStatus = status || "Approved";
    if (!["Approved", "Rejected", "Cancelled"].includes(finalStatus)) {
      return NextResponse.json(
        { error: "สถานะที่ระบุไม่ถูกต้อง (ต้องเป็น Approved, Rejected หรือ Cancelled)" },
        { status: 400 }
      );
    }

    if (finalStatus === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผลในการปฏิเสธคำขอการจอง" },
        { status: 400 }
      );
    }

    updates.status = finalStatus;
    updates.approvedBy = session.name || "นายชาตรี เริงชัยภูมิ";
    updates.approvalStatus = finalStatus === "Approved" ? "approved" : "rejected";
    updates.approvedAt = nowIso;

    if (finalStatus === "Rejected") {
      updates.rejectionReason = rejectionReason.trim();
      webhookEvent = "booking_rejected";
      message = "ปฏิเสธคำขอใช้ห้องประชุมเรียบร้อย";
    } else if (finalStatus === "Approved") {
      webhookEvent = "booking_approved";
      message = "อนุมัติคำขอใช้ห้องประชุมเรียบร้อย (ขั้นตอนสมบูรณ์)";
    } else {
      webhookEvent = "booking_cancelled";
      message = "ยกเลิกคำขอใช้ห้องประชุมเรียบร้อย";
    }
  }

  const updated = await db.updateBooking(params.id, updates);

  // Send In-App Notification to Requester
  const allUsers = await db.getUsers();
  const ownerUser = allUsers.find((u) => u.email === booking.bookedByEmail);

  await db.createNotification({
    notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipientUserId: ownerUser?.userId || booking.bookedByEmail,
    title: `อัปเดตสถานะคำขอ: ${booking.roomName}`,
    message: `${message} (หัวข้อ: "${booking.title}") โดย ${session.name}`,
    type: updates.status === "Approved" ? "booking_approved" : updates.status === "Rejected" ? "booking_rejected" : "system",
    bookingId: booking.bookingId,
    isRead: false,
    createdAt: nowIso,
  });

  // Broadcast Real-time Event via SSE
  eventHub.broadcast(webhookEvent, updated);

  // Real-time Webhook Notification
  if (updated) {
    sendWebhookNotification(webhookEvent, updated, message).catch((err) =>
      console.warn("Async webhook failed:", err)
    );
  }

  // Audit Log
  await logAuditEvent({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: `UPDATE_STATUS_${updates.status}`,
    entityType: "Booking",
    entityId: params.id,
    details: updates,
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return NextResponse.json({
    success: true,
    booking: updated,
    message,
  });
}
