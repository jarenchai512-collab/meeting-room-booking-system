import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";
import { canModifyBooking, canCancelBooking } from "@/lib/auth/permissions";
import { eventHub } from "@/lib/events/event-emitter";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  const db = await getDb();
  const booking = await db.getBookingById(params.id);

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 });
  }

  // Hide notes from normal users if not owner and not elevated
  const isElevated = session?.role === "Admin" || session?.role === "Approver" || session?.role === "Inspector" || session?.role === "Endorser";
  const isOwner = session?.email === booking.bookedByEmail;

  if (!isElevated && !isOwner) {
    const { notes, ...publicInfo } = booking;
    return NextResponse.json({ booking: publicInfo });
  }

  return NextResponse.json({ booking });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  const db = await getDb();
  const existing = await db.getBookingById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 });
  }

  if (!canModifyBooking(session, existing)) {
    return forbiddenResponse("คุณสามารถแก้ไขได้เฉพาะคำขอของคุณที่อยู่ในสถานะรออนุมัติเท่านั้น");
  }

  const body = await req.json();
  const updates: any = {};
  if (body.title) updates.title = body.title.trim();
  if (body.purpose) updates.purpose = body.purpose.trim();
  if (body.notes !== undefined) updates.notes = body.notes.trim();
  if (body.equipment) updates.equipment = body.equipment;
  if (body.attendeesCount) updates.attendeesCount = Number(body.attendeesCount);

  const updated = await db.updateBooking(params.id, updates);

  // Broadcast event
  eventHub.broadcast("booking_created", updated);

  await logAuditEvent({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "UPDATE_BOOKING",
    entityType: "Booking",
    entityId: params.id,
    details: updates,
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return NextResponse.json({ success: true, booking: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  const db = await getDb();
  const existing = await db.getBookingById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 });
  }

  if (!canCancelBooking(session, existing)) {
    return forbiddenResponse("คุณไม่มีสิทธิ์ยกเลิกการจองนี้");
  }

  const updated = await db.updateBooking(params.id, {
    status: "Cancelled",
  });

  eventHub.broadcast("booking_cancelled", updated);

  await logAuditEvent({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "CANCEL_BOOKING",
    entityType: "Booking",
    entityId: params.id,
    details: "Booking cancelled by user/admin",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return NextResponse.json({ success: true, message: "ยกเลิกการจองเรียบร้อยแล้ว" });
}
