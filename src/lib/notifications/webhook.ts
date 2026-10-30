import { Booking } from "../data/types";
import { getDb } from "../data/repository";

export interface WebhookPayload {
  event:
    | "booking_created"
    | "room_inspected"
    | "booking_endorsed"
    | "booking_approved"
    | "booking_rejected"
    | "booking_cancelled";
  timestamp: string;
  collegeName: string;
  booking: {
    bookingId: string;
    title: string;
    roomName: string;
    bookedBy: string;
    department: string;
    phoneNumber?: string;
    date: string;
    time: string;
    attendeesCount: number;
    status: string;
    // 3-Stage details
    inspection?: {
      inspector: string;
      status: string;
      note?: string;
    };
    endorsement?: {
      endorser: string;
      status: string;
    };
    approval?: {
      approver: string;
      status: string;
      rejectionReason?: string;
    };
  };
  summaryText: string;
}

export async function sendWebhookNotification(
  event: WebhookPayload["event"],
  booking: Booking,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    const webhookUrl = await db.getSetting("WEBHOOK_URL");

    if (!webhookUrl || !webhookUrl.trim() || !webhookUrl.startsWith("http")) {
      // No active webhook configured
      return { success: false, error: "WEBHOOK_URL_NOT_CONFIGURED" };
    }

    const collegeName =
      (await db.getSetting("COLLEGE_NAME")) ||
      "วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์";

    let eventTitleThai = "แจ้งเตือนระบบจองห้องประชุมออนไลน์";
    switch (event) {
      case "booking_created":
        eventTitleThai = "📢 [มีคำขอใช้ห้องประชุมใหม่]";
        break;
      case "room_inspected":
        eventTitleThai = `🔍 [ตรวจสอบความพร้อมห้อง: ${booking.inspectionStatus === "ready" ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}]`;
        break;
      case "booking_endorsed":
        eventTitleThai = "✍️ [หัวหน้างานรับรองคำขอเรียบร้อย]";
        break;
      case "booking_approved":
        eventTitleThai = "✅ [อนุมัติการใช้ห้องประชุมเรียบร้อย]";
        break;
      case "booking_rejected":
        eventTitleThai = "❌ [ไม่อนุมัติคำขอใช้ห้องประชุม]";
        break;
      case "booking_cancelled":
        eventTitleThai = "⚠️ [ยกเลิกการจองห้องประชุม]";
        break;
    }

    const summaryText = [
      `${eventTitleThai}`,
      `สถาบัน: ${collegeName}`,
      `หัวข้อ: ${booking.title}`,
      `ห้องประชุม: ${booking.roomName}`,
      `ผู้ขอจอง: ${booking.bookedBy} (${booking.department || "-"})`,
      `วัน-เวลา: ${booking.date} เวลา ${booking.startTime} - ${booking.endTime} น.`,
      `จำนวนผู้เข้าใช้: ${booking.attendeesCount} คน`,
      `สถานะปัจจุบัน: ${booking.status}`,
      booking.rejectionReason ? `เหตุผล: ${booking.rejectionReason}` : "",
      customMessage ? `หมายเหตุเพิ่มเติม: ${customMessage}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      collegeName,
      booking: {
        bookingId: booking.bookingId,
        title: booking.title,
        roomName: booking.roomName,
        bookedBy: booking.bookedBy,
        department: booking.department,
        phoneNumber: booking.phoneNumber,
        date: booking.date,
        time: `${booking.startTime} - ${booking.endTime} น.`,
        attendeesCount: booking.attendeesCount,
        status: booking.status,
        inspection: {
          inspector: booking.inspectionInspector || "นายวัชรพงศ์ โสภา",
          status: booking.inspectionStatus || "pending",
          note: booking.inspectionNote,
        },
        endorsement: {
          endorser: booking.endorserName || "นายเอกราช เขียวทอง",
          status: booking.endorsementStatus || "pending",
        },
        approval: {
          approver: booking.approvedBy || "นายชาตรี เริงชัยภูมิ",
          status: booking.approvalStatus || "pending",
          rejectionReason: booking.rejectionReason,
        },
      },
      summaryText,
    };

    // Format for Discord or Slack or LINE Notify or Generic JSON
    let bodyToSend: any = payload;
    if (webhookUrl.includes("discord.com/api/webhooks")) {
      bodyToSend = {
        content: `**${eventTitleThai}**\n${summaryText}`,
        embeds: [
          {
            title: booking.title,
            description: `ห้องประชุม: **${booking.roomName}**\nผู้ขอจอง: **${booking.bookedBy}** (${booking.department})\nวันที่: ${booking.date} (${booking.startTime}-${booking.endTime} น.)`,
            color:
              event === "booking_approved"
                ? 0x10b981
                : event === "booking_rejected"
                ? 0xef4444
                : 0x2563eb,
            footer: {
              text: `${collegeName} • งานศูนย์ดิจิทัลและสื่อสารองค์กร`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } else if (webhookUrl.includes("slack.com/services")) {
      bodyToSend = {
        text: `*${eventTitleThai}*\n${summaryText}`,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyToSend),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return { success: res.ok };
  } catch (err: any) {
    console.warn("sendWebhookNotification error:", err?.message);
    return { success: false, error: err?.message };
  }
}
