"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner, EmptyState } from "@/components/ui/LoadingSpinner";
import { RoomUtilizationChart } from "@/components/charts/RoomUtilizationChart";
import { DepartmentRankingChart } from "@/components/charts/DepartmentRankingChart";
import { BookingDetailModal } from "@/components/modals/BookingDetailModal";
import { useRealtimeEvents } from "@/lib/events/use-realtime";
import { Booking, Room } from "@/lib/data/types";
import { formatThaiDisplayDate } from "@/lib/utils/date";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Users,
  Megaphone,
  BellRing,
  Info,
  Building,
  CheckCheck,
  ChevronRight,
  Printer,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Announcement state
  const [announcement, setAnnouncement] = useState<string>(
    "งานศูนย์ดิจิทัลและสื่อสารองค์กร แจ้งเปิดให้บริการจองห้องประชุมออนไลน์ทั้ง 6 ห้องหลักตามปกติ หากต้องการอุปกรณ์โสตทัศนูปกรณ์หรือระบบถ่ายทอดสดพิเศษ กรุณาประสานงานล่วงหน้าอย่างน้อย 2 วันทำการ"
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRooms, resBookings, resSettings] = await Promise.all([
        fetch("/api/rooms?all=true"),
        fetch("/api/bookings"),
        fetch("/api/settings").catch(() => null),
      ]);

      if (resRooms.ok) {
        const dataRooms = await resRooms.json();
        setRooms(dataRooms.rooms || []);
      }
      if (resBookings.ok) {
        const dataBookings = await resBookings.json();
        setBookings(dataBookings.bookings || []);
      }
      if (resSettings && resSettings.ok) {
        const settings = await resSettings.json();
        const found = settings.find(
          (s: any) => s.settingKey === "DIGITAL_CENTER_ANNOUNCEMENT"
        );
        if (found?.settingValue) setAnnouncement(found.settingValue);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time listener: refresh when booking or room changes
  useRealtimeEvents((event) => {
    if (
      event.type === "booking_created" ||
      event.type === "booking_approved" ||
      event.type === "booking_rejected" ||
      event.type === "booking_cancelled" ||
      event.type === "room_updated" ||
      event.type === "room_inspected" ||
      event.type === "booking_endorsed"
    ) {
      fetchData();
    }
  });

  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  }, []);

  // 4 Required Real-time Metrics
  const stats = useMemo(() => {
    // 1. การจองวันนี้
    const todayBookings = bookings.filter((b) => b.date === todayStr);
    const todayCount = todayBookings.length;

    // 2. รออนุมัติ (รวม Pending, Inspected, Endorsed)
    const pendingCount = bookings.filter(
      (b) => b.status === "Pending" || b.status === "Inspected" || b.status === "Endorsed"
    ).length;

    // 3. อนุมัติแล้ว
    const approvedCount = bookings.filter((b) => b.status === "Approved").length;

    // 4. จำนวนผู้เข้าใช้รวม (attendees total across all approved/active bookings)
    const totalAttendees = bookings
      .filter((b) => b.status !== "Cancelled" && b.status !== "Rejected")
      .reduce((sum, b) => sum + (b.attendeesCount || 0), 0);

    // กราฟ 1: จัดอันดับห้องประชุมที่ถูกใช้งานสูงสุด
    const roomUsageMap = new Map<string, { roomId: string; name: string; bookings: number; color?: string }>();
    rooms.forEach((r) => {
      roomUsageMap.set(r.roomId, {
        roomId: r.roomId,
        name: r.name,
        color: r.color,
        bookings: 0,
      });
    });
    bookings.forEach((b) => {
      const item = roomUsageMap.get(b.roomId);
      if (item && b.status === "Approved") {
        item.bookings += 1;
      }
    });
    const roomRanking = Array.from(roomUsageMap.values()).sort((a, b) => b.bookings - a.bookings);

    // กราฟ 2: จัดอันดับแผนกวิชาที่ขอใช้บริการ
    const deptUsageMap = new Map<string, number>();
    bookings.forEach((b) => {
      if (b.department && b.status !== "Cancelled") {
        deptUsageMap.set(b.department, (deptUsageMap.get(b.department) || 0) + 1);
      }
    });
    const departmentRanking = Array.from(deptUsageMap.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    return {
      todayCount,
      pendingCount,
      approvedCount,
      totalAttendees,
      roomRanking,
      departmentRanking,
      todayBookings,
    };
  }, [rooms, bookings, todayStr]);

  if (loading && rooms.length === 0) {
    return (
      <AppShell>
        <LoadingSpinner message="กำลังรวบรวมข้อมูล Dashboard และสถิติเรียลไทม์..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            แดชบอร์ดภาพรวมระบบ (Real-time Dashboard)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ • งานศูนย์ดิจิทัลและสื่อสารองค์กร
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>ปฏิทินห้องประชุม</span>
          </Link>
          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ยื่นคำขอจองห้องทันที</span>
          </Link>
        </div>
      </div>

      {/* 4 Required Metric Cards: การจองวันนี้ / รออนุมัติ / อนุมัติแล้ว / จำนวนผู้เข้าใช้รวม */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: การจองวันนี้ */}
        <StatCard
          title="การจองวันนี้"
          value={stats.todayCount}
          subtitle={`ประจำวันที่ ${formatThaiDisplayDate(todayStr)}`}
          icon={Calendar}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        {/* Card 2: รออนุมัติ */}
        <StatCard
          title="รออนุมัติ"
          value={stats.pendingCount}
          subtitle={stats.pendingCount > 0 ? "มีคำขอรอการพิจารณา 3 ระดับ" : "ไม่มีคำขอค้าง"}
          icon={AlertCircle}
          iconBgColor={stats.pendingCount > 0 ? "bg-amber-50" : "bg-slate-50"}
          iconColor={stats.pendingCount > 0 ? "text-amber-600" : "text-slate-400"}
          onClick={() => (window.location.href = "/approvals")}
        />

        {/* Card 3: อนุมัติแล้ว */}
        <StatCard
          title="อนุมัติแล้ว"
          value={stats.approvedCount}
          subtitle="คำขอที่ได้รับการอนุมัติเสร็จสมบูรณ์"
          icon={CheckCheck}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />

        {/* Card 4: จำนวนผู้เข้าใช้รวม */}
        <StatCard
          title="จำนวนผู้เข้าใช้รวม"
          value={`${stats.totalAttendees.toLocaleString()} คน`}
          subtitle="รวมผู้เข้าร่วมประชุมและกิจกรรมทั้งหมด"
          icon={Users}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* ส่วนประกาศประชาสัมพันธ์สถานะห้องประชุมหรือข่าวสารจากงานศูนย์ดิจิทัลฯ */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative border border-blue-800/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold">
              <Megaphone className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
              <span>ประกาศจากงานศูนย์ดิจิทัลและสื่อสารองค์กร</span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              สถานะห้องประชุมและระบบดิจิทัล ประจำภาคเรียน
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {announcement}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-blue-200">
              <span>ผู้ดูแลระบบ: นายวัชรพงศ์ โสภา (ตรวจห้อง)</span>
              <span>•</span>
              <span>หัวหน้างาน: นายเอกราช เขียวทอง (รับรองคำขอ)</span>
              <span>•</span>
              <span>โทรสายใน: 104-105</span>
            </div>
          </div>

          {/* Quick Room Status Chips */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 w-full lg:w-80 space-y-2 text-xs">
            <div className="font-bold text-white flex items-center justify-between border-b border-white/10 pb-1.5">
              <span>สถานะห้องประชุม 6 ห้องหลัก</span>
              <span className="text-[10px] text-emerald-400 font-normal">● พร้อมใช้งานทั้งหมด</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {rooms.slice(0, 6).map((r) => (
                <div key={r.roomId} className="flex items-center gap-1.5 text-slate-200 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate">{r.name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2 Graphs: 1. จัดอันดับห้องประชุมที่ถูกใช้งานสูงสุด / 2. จัดอันดับแผนกวิชาที่ขอใช้บริการ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Graph 1 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                กราฟจัดอันดับห้องประชุมที่ถูกใช้งานสูงสุด
              </h3>
              <p className="text-[11px] text-slate-500">
                สถิติจำนวนครั้งที่ได้รับอนุมัติใช้งานในแต่ละห้อง
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
              6 ห้องหลัก
            </span>
          </div>
          <RoomUtilizationChart data={stats.roomRanking} />
        </div>

        {/* Graph 2 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                กราฟจัดอันดับแผนกวิชาที่ขอใช้บริการ
              </h3>
              <p className="text-[11px] text-slate-500">
                จำแนกตามหน่วยงาน / สาขาวิชาที่มีคำขอใช้ห้องประชุมสูงสุด
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">
              แผนกวิชา
            </span>
          </div>
          <DepartmentRankingChart data={stats.departmentRanking} />
        </div>
      </div>

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              กำหนดการใช้ห้องประชุมวันนี้ ({formatThaiDisplayDate(todayStr)})
            </h3>
            <p className="text-[11px] text-slate-500">
              รายการการจองและกิจกรรมที่เกิดขึ้นในวันนี้แบบเรียลไทม์
            </p>
          </div>
          <Link
            href="/calendar"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>ดูปฏิทินเต็มรูปแบบ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.todayBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            ไม่มีกิจกรรมการใช้ห้องประชุมในวันนี้
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">หัวข้อ</th>
                  <th className="py-2.5 px-4">ห้องประชุม</th>
                  <th className="py-2.5 px-4">เวลา</th>
                  <th className="py-2.5 px-4">ผู้ขอจอง / แผนกวิชา</th>
                  <th className="py-2.5 px-4">สถานะ</th>
                  <th className="py-2.5 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats.todayBookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {b.title}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{b.roomName}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-blue-700">
                      {b.startTime} - {b.endTime} น.
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{b.bookedBy}</div>
                      <div className="text-[11px] text-slate-400">{b.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedBookingId(b.bookingId)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onUpdated={fetchData}
        />
      )}
    </AppShell>
  );
}
