import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth/middleware-auth";
import { getDb } from "@/lib/data/repository";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session) return unauthorizedResponse();

  // Admin and Approver have access to reports
  if (session.role !== "Admin" && session.role !== "Approver") {
    return forbiddenResponse("เฉพาะ Admin หรือ Approver เท่านั้นที่สามารถดูรายงานได้");
  }

  const url = new URL(req.url);
  const dateFrom = url.searchParams.get("dateFrom") || undefined;
  const dateTo = url.searchParams.get("dateTo") || undefined;
  const roomId = url.searchParams.get("roomId") || undefined;
  const department = url.searchParams.get("department") || undefined;

  const db = await getDb();
  const [{ bookings }, rooms] = await Promise.all([
    db.getBookings({ dateFrom, dateTo, roomId, department }),
    db.getRooms(true),
  ]);

  const total = bookings.length;
  const approved = bookings.filter((b) => b.status === "Approved").length;
  const pending = bookings.filter((b) => b.status === "Pending").length;
  const rejected = bookings.filter((b) => b.status === "Rejected").length;
  const cancelled = bookings.filter((b) => b.status === "Cancelled").length;

  // Breakdown by room
  const roomStatsMap = new Map<
    string,
    { roomId: string; name: string; color: string; bookings: number; approved: number; totalHours: number }
  >();

  rooms.forEach((r) => {
    roomStatsMap.set(r.roomId, {
      roomId: r.roomId,
      name: r.name,
      color: r.color,
      bookings: 0,
      approved: 0,
      totalHours: 0,
    });
  });

  bookings.forEach((b) => {
    let stat = roomStatsMap.get(b.roomId);
    if (!stat) {
      stat = {
        roomId: b.roomId,
        name: b.roomName,
        color: "#2563EB",
        bookings: 0,
        approved: 0,
        totalHours: 0,
      };
      roomStatsMap.set(b.roomId, stat);
    }
    stat.bookings += 1;
    if (b.status === "Approved") {
      stat.approved += 1;
      // Calculate hours
      const [sh, sm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      const durationHours = Math.max(0, eh + em / 60 - (sh + sm / 60));
      stat.totalHours += durationHours;
    }
  });

  // Department distribution
  const deptMap = new Map<string, number>();
  bookings.forEach((b) => {
    const dept = b.department || "ไม่ระบุ";
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });

  // Daily trends
  const dailyMap = new Map<string, { bookings: number; approved: number }>();
  bookings.forEach((b) => {
    const d = b.date;
    const current = dailyMap.get(d) || { bookings: 0, approved: 0 };
    current.bookings += 1;
    if (b.status === "Approved") current.approved += 1;
    dailyMap.set(d, current);
  });

  const dailyTrends = Array.from(dailyMap.entries())
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    summary: {
      total,
      approved,
      pending,
      rejected,
      cancelled,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    },
    roomStats: Array.from(roomStatsMap.values()),
    departmentStats: Array.from(deptMap.entries()).map(([department, count]) => ({
      department,
      count,
    })),
    dailyTrends,
  });
}
