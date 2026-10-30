import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";
import { roomMutex } from "@/lib/concurrency/mutex";
import { eventHub } from "@/lib/events/event-emitter";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { sendWebhookNotification } from "@/lib/notifications/webhook";
import { Booking, BookingFilter, BookingStatus } from "@/lib/data/types";
import {
  isTimeRangeOverlapping,
  isValidTimeInterval,
  toBangkokIso,
} from "@/lib/utils/date";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const url = new URL(req.url);

    const filter: BookingFilter = {
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
      roomId: url.searchParams.get("roomId") || undefined,
      department: url.searchParams.get("department") || undefined,
      status: (url.searchParams.get("status") as BookingStatus) || undefined,
      bookedByEmail: url.searchParams.get("bookedByEmail") || undefined,
      search: url.searchParams.get("search") || undefined,
      page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : undefined,
      limit: url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined,
    };

    const db = await getDb();
    const result = await db.getBookings(filter);

    const isElevated =
      session?.role === "Admin" ||
      session?.role === "Approver" ||
      session?.role === "Inspector" ||
      session?.role === "Endorser";

    const sanitizedBookings = result.bookings.map((b) => {
      const isOwner = session?.email === b.bookedByEmail;
      if (isElevated || isOwner) return b;
      return {
        ...b,
        notes: undefined,
      };
    });

    return NextResponse.json({
      bookings: sanitizedBookings,
      total: result.total,
      page: filter.page || 1,
      limit: filter.limit || result.total,
    });
  } catch (err: any) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลการจองได้: " + err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) {
    return unauthorizedResponse("กรุณาเข้าสู่ระบบก่อนทำการจองห้องประชุม");
  }

  const idempotencyKey = req.headers.get("x-idempotency-key");

  // Check idempotency cache first
  if (idempotencyKey) {
    const cached = roomMutex.getIdempotencyResult(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached.response, { status: cached.status });
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูล JSON ไม่ถูกต้อง" }, { status: 400 });
  }

  const {
    roomId,
    title,
    requesterPrefix = "นาย",
    bookedBy,
    position,
    department,
    phoneNumber,
    writtenDate,
    date,
    endDate,
    startTime,
    endTime,
    attendeesCount,
    purpose = "",
    otherRoomDetail = "",
    equipment = [],
    tableChairCount = 0,
    otherEquipment = "",
    assetAgreementConfirmed,
    notes = "",
    fileAttachmentUrl,
    fileAttachmentId,
    fileName,
  } = body;

  // Validation according to official form
  if (!roomId || !title || !date || !startTime || !endTime || !attendeesCount) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ห้อง, หัวข้อ, วันที่, เวลา, จำนวนผู้เข้าร่วม)" },
      { status: 400 }
    );
  }

  if (!assetAgreementConfirmed) {
    return NextResponse.json(
      {
        error:
          "กรุณากดรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการ และปฏิบัติตามระเบียบของวิทยาลัยก่อนส่งคำขอ",
      },
      { status: 400 }
    );
  }

  if (!isValidTimeInterval(startTime, endTime)) {
    return NextResponse.json(
      { error: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นเสมอ" },
      { status: 400 }
    );
  }

  const count = Number(attendeesCount);
  if (isNaN(count) || count <= 0) {
    return NextResponse.json(
      { error: "จำนวนผู้เข้าร่วมต้องเป็นตัวเลขมากกว่า 0" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const room = await db.getRoomById(roomId);
  if (!room) {
    return NextResponse.json({ error: "ไม่พบห้องประชุมที่ระบุ" }, { status: 404 });
  }

  if (!room.isAvailable) {
    return NextResponse.json(
      { error: `ห้อง "${room.name}" ปิดปรับปรุงหรือไม่เปิดให้จองในขณะนี้` },
      { status: 400 }
    );
  }

  if (count > room.capacity && roomId !== "room_other") {
    return NextResponse.json(
      {
        error: `จำนวนผู้เข้าร่วม (${count} คน) เกินความจุสูงสุดของห้อง "${room.name}" (${room.capacity} คน)`,
      },
      { status: 400 }
    );
  }

  const startDateTime = toBangkokIso(date, startTime);
  const endDateTime = toBangkokIso(date, endTime);

  // Acquire Mutex Lock for this room to avoid double booking race condition
  let releaseLock: (() => void) | null = null;
  try {
    releaseLock = await roomMutex.acquire(roomId, 8000);

    // Conflict Detection (ห้ามจองห้องเดียวกันในเวลาที่ซ้อนทับกัน)
    const existingBookings = await db.getBookings({ roomId, dateFrom: date, dateTo: date });

    const conflictingBooking = existingBookings.bookings.find((existing) => {
      // Ignore rejected or cancelled bookings
      if (existing.status === "Cancelled" || existing.status === "Rejected") {
        return false;
      }
      return isTimeRangeOverlapping(
        startDateTime,
        endDateTime,
        existing.startDateTime,
        existing.endDateTime
      );
    });

    if (conflictingBooking) {
      const conflictMsg = `ห้อง "${room.name}" ไม่ว่างในช่วงเวลา ${startTime} - ${endTime} น. เนื่องจากมีการจองหัวข้อ "${conflictingBooking.title}" (${conflictingBooking.startTime} - ${conflictingBooking.endTime} น.) โดย ${conflictingBooking.bookedBy} (${conflictingBooking.department}) อยู่แล้ว`;
      const errRes = {
        error: conflictMsg,
        conflictWith: conflictingBooking.bookingId,
        conflictingBooking: {
          title: conflictingBooking.title,
          time: `${conflictingBooking.startTime} - ${conflictingBooking.endTime} น.`,
          bookedBy: conflictingBooking.bookedBy,
          department: conflictingBooking.department,
        },
      };
      if (idempotencyKey) {
        roomMutex.saveIdempotencyResult(idempotencyKey, errRes, 409);
      }
      return NextResponse.json(errRes, { status: 409 });
    }

    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const inspectorOfficer =
      (await db.getSetting("OFFICER_INSPECTOR")) || "นายวัชรพงศ์ โสภา";
    const endorserOfficer =
      (await db.getSetting("OFFICER_ENDORSER")) || "นายเอกราช เขียวทอง";
    const approverOfficer =
      (await db.getSetting("OFFICER_APPROVER")) || "นายชาตรี เริงชัยภูมิ";

    const newBooking: Booking = {
      bookingId,
      title: title.trim(),
      roomId: room.roomId,
      roomName: room.name,
      otherRoomDetail: otherRoomDetail?.trim() || undefined,

      requesterPrefix: requesterPrefix || session.prefix || "นาย",
      bookedBy: bookedBy?.trim() || session.name,
      position: position?.trim() || session.position || "บุคลากร",
      department: department?.trim() || session.department || "ไม่ระบุแผนก",
      phoneNumber: phoneNumber?.trim() || session.phoneNumber || "",
      bookedByEmail: session.email,
      writtenDate: writtenDate || new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date()),

      date,
      endDate: endDate || date,
      startTime,
      endTime,
      startDateTime,
      endDateTime,
      attendeesCount: count,

      purpose: purpose?.trim() || title.trim(),
      equipment: Array.isArray(equipment) ? equipment : [],
      tableChairCount: Number(tableChairCount) || 0,
      otherEquipment: otherEquipment?.trim() || undefined,
      assetAgreementConfirmed: true,

      notes: notes?.trim() || "",
      fileAttachmentUrl: fileAttachmentUrl || "",
      fileAttachmentId: fileAttachmentId || "",
      fileName: fileName || "",
      status: "Pending",

      // 3-Stage Initialization
      inspectionInspector: inspectorOfficer,
      inspectionStatus: "pending",

      endorserName: endorserOfficer,
      endorsementStatus: "pending",

      approvedBy: approverOfficer,
      approvalStatus: "pending",

      idempotencyKey: idempotencyKey || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const created = await db.createBooking(newBooking);

    // In-App Notification
    const notifTitle = `มีคำขอจองห้อง ${room.name} ใหม่รอการตรวจสอบ`;
    const notifMsg = `${newBooking.bookedBy} (${newBooking.department}) ยื่นคำขอจองห้อง ${room.name} วันที่ ${date} เวลา ${startTime} - ${endTime} น. หัวข้อ: ${title}`;

    await db.createNotification({
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUserId: "all_approvers",
      recipientRole: "Approver",
      title: notifTitle,
      message: notifMsg,
      type: "booking_created",
      bookingId: created.bookingId,
      isRead: false,
      createdAt: nowIso,
    });

    // Broadcast Real-time Event via SSE
    eventHub.broadcast("booking_created", created);

    // Real-time Webhook Notification
    sendWebhookNotification("booking_created", created).catch((err) =>
      console.warn("Async webhook failed:", err)
    );

    // Audit Log
    await logAuditEvent({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: "CREATE_BOOKING",
      entityType: "Booking",
      entityId: created.bookingId,
      details: {
        roomId: room.roomId,
        roomName: room.name,
        date,
        time: `${startTime}-${endTime}`,
        attendeesCount: count,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const successRes = {
      success: true,
      booking: created,
      message: "ส่งแบบคำขออนุญาตใช้ห้องประชุมเรียบร้อย รอเจ้าหน้าที่และผู้บริหารพิจารณาตามลำดับ",
    };

    if (idempotencyKey) {
      roomMutex.saveIdempotencyResult(idempotencyKey, successRes, 201);
    }

    return NextResponse.json(successRes, { status: 201 });
  } catch (err: any) {
    console.error("Booking creation error:", err);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกการจอง: " + err?.message },
      { status: 500 }
    );
  } finally {
    if (releaseLock) {
      releaseLock();
    }
  }
}
