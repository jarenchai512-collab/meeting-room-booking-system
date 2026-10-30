import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";
import { canManageRooms } from "@/lib/auth/permissions";
import { eventHub } from "@/lib/events/event-emitter";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();
  if (!canManageRooms(session.role)) {
    return forbiddenResponse("เฉพาะ Admin เท่านั้นที่สามารถแก้ไขห้องประชุมได้");
  }

  const db = await getDb();
  const existing = await db.getRoomById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบห้องประชุม" }, { status: 404 });
  }

  const body = await req.json();
  const updates: any = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.building !== undefined) updates.building = body.building.trim();
  if (body.floor !== undefined) updates.floor = body.floor.trim();
  if (body.capacity !== undefined) updates.capacity = Number(body.capacity);
  if (body.equipmentList !== undefined) updates.equipmentList = body.equipmentList;
  if (body.isAvailable !== undefined) updates.isAvailable = Boolean(body.isAvailable);
  if (body.color !== undefined) updates.color = body.color;
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl.trim();

  const updated = await db.updateRoom(params.id, updates);
  eventHub.broadcast("room_updated", updated);

  await logAuditEvent({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "UPDATE_ROOM",
    entityType: "Room",
    entityId: params.id,
    details: updates,
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return NextResponse.json({ success: true, room: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();
  if (!canManageRooms(session.role)) {
    return forbiddenResponse("เฉพาะ Admin เท่านั้นที่สามารถปิดใช้งานห้องประชุมได้");
  }

  const db = await getDb();
  const deleted = await db.deleteRoom(params.id);
  eventHub.broadcast("room_updated", { roomId: params.id, isAvailable: false });

  await logAuditEvent({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "DISABLE_ROOM",
    entityType: "Room",
    entityId: params.id,
    details: "Room disabled by admin",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return NextResponse.json({ success: deleted });
}
