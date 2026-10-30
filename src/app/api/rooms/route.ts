import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";
import { canManageRooms } from "@/lib/auth/permissions";
import { eventHub } from "@/lib/events/event-emitter";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { Room } from "@/lib/data/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "true";

    const db = await getDb();
    // Admin can see all rooms (including disabled); others only active rooms
    const includeUnavailable = all && session?.role === "Admin";
    const rooms = await db.getRooms(includeUnavailable);

    return NextResponse.json({ rooms });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();
  if (!canManageRooms(session.role)) {
    return forbiddenResponse("เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่มห้องประชุมได้");
  }

  const body = await req.json();
  const {
    name,
    building,
    floor,
    capacity,
    equipmentList = [],
    isAvailable = true,
    color = "#2563EB",
    description = "",
    imageUrl = "",
  } = body;

  if (!name || !capacity) {
    return NextResponse.json(
      { error: "กรุณาระบุชื่อห้องประชุมและความจุ" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowIso = new Date().toISOString();

  const newRoom: Room = {
    roomId,
    name: name.trim(),
    building: building?.trim() || "อาคารหลัก",
    floor: floor?.trim() || "ชั้น 1",
    capacity: Number(capacity),
    equipmentList: Array.isArray(equipmentList) ? equipmentList : [],
    isAvailable: Boolean(isAvailable),
    color,
    description: description?.trim() || "",
    imageUrl: imageUrl?.trim() || "",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const created = await db.createRoom(newRoom);
  eventHub.broadcast("room_updated", created);

  await logAuditEvent({
    userId: session.userId,
    userName: session.name,
    userRole: session.role,
    action: "CREATE_ROOM",
    entityType: "Room",
    entityId: created.roomId,
    details: { name: created.name, capacity: created.capacity },
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
  });

  return NextResponse.json({ success: true, room: created }, { status: 201 });
}
