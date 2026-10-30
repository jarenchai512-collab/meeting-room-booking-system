"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner, EmptyState } from "@/components/ui/LoadingSpinner";
import { BookingDetailModal } from "@/components/modals/BookingDetailModal";
import { useRealtimeEvents } from "@/lib/events/use-realtime";
import { Booking, Room, BookingStatus } from "@/lib/data/types";
import { formatThaiDisplayDate } from "@/lib/utils/date";
import { exportBookingsToExcel, exportBookingsToCsv } from "@/lib/utils/export";
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Calendar,
  Clock,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
} from "lucide-react";

export default function BookingsListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roomId, setRoomId] = useState("all");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roomId !== "all") params.set("roomId", roomId);
      if (status !== "all") params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const [resBookings, resRooms] = await Promise.all([
        fetch(`/api/bookings?${params.toString()}`),
        fetch("/api/rooms"),
      ]);

      if (resBookings.ok) {
        const data = await resBookings.json();
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
      }
      if (resRooms.ok) {
        const data = await resRooms.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, roomId, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  useRealtimeEvents((event) => {
    if (
      event.type === "booking_created" ||
      event.type === "booking_approved" ||
      event.type === "booking_rejected" ||
      event.type === "booking_cancelled" ||
      event.type === "room_inspected" ||
      event.type === "booking_endorsed"
    ) {
      fetchData();
    }
  });

  const handleExportExcel = () => {
    exportBookingsToExcel(
      bookings,
      `แบบรายการจองห้องประชุม_วท_ท่าหลวง_${Date.now()}.xlsx`
    );
  };

  const handleExportCsv = () => {
    exportBookingsToCsv(
      bookings,
      `แบบรายการจองห้องประชุม_วท_ท่าหลวง_${Date.now()}.csv`
    );
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AppShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            รายการคำขอจองห้องประชุม
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ • ค้นหา ตรวจสอบ และพิมพ์แบบคำขอ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Export Buttons */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
            title="ส่งออกไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
            title="ส่งออกไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <Link
            href="/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ยื่นคำขอใหม่</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อประชุม, ผู้จอง, หรือแผนกวิชา..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">ทุกห้องประชุม (6 ห้องหลัก)</option>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="Pending">รอพิจารณา (Pending)</option>
            <option value="Inspected">ตรวจห้องแล้ว (Inspected)</option>
            <option value="Endorsed">รับรองแล้ว (Endorsed)</option>
            <option value="Approved">อนุมัติแล้ว (Approved)</option>
            <option value="Rejected">ปฏิเสธ (Rejected)</option>
            <option value="Cancelled">ยกเลิกแล้ว (Cancelled)</option>
          </select>

          {(search || roomId !== "all" || status !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setRoomId("all");
                setStatus("all");
                setPage(1);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="กำลังโหลดรายการคำขอจอง..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="ไม่พบรายการการจอง"
            description="ยังไม่มีรายการคำขอจองที่ตรงกับเงื่อนไขการค้นหาของคุณ"
            actionText="ยื่นคำขอจองห้องใหม่"
            onAction={() => (window.location.href = "/bookings/new")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">หัวข้อการประชุม / เรื่อง</th>
                  <th className="py-3.5 px-4">ห้องประชุม</th>
                  <th className="py-3.5 px-4">วัน & เวลา</th>
                  <th className="py-3.5 px-4">ผู้ยื่นคำขอ / แผนกวิชา</th>
                  <th className="py-3.5 px-4 text-center">คน</th>
                  <th className="py-3.5 px-4">สถานะพิจารณา 3 ระดับ</th>
                  <th className="py-3.5 px-6 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{b.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {b.bookingId}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      <div>{b.roomName}</div>
                      {b.otherRoomDetail && (
                        <div className="text-[10px] text-slate-500 truncate">({b.otherRoomDetail})</div>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{formatThaiDisplayDate(b.date)}</div>
                      <div className="text-[11px] text-blue-600 font-medium">
                        {b.startTime} - {b.endTime} น.
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {b.requesterPrefix ? `${b.requesterPrefix} ` : ""}
                        {b.bookedBy}
                      </div>
                      <div className="text-[11px] text-slate-500">{b.department}</div>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-800">
                      {b.attendeesCount}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={b.status} size="sm" />
                      <div className="text-[10px] text-slate-400 mt-1">
                        {b.status === "Approved"
                          ? "✓ ผ่านครบ 3 ระดับ"
                          : b.endorsementStatus === "endorsed"
                          ? "• รอ ผอ./รองผอ. อนุมัติ"
                          : b.inspectionStatus === "ready"
                          ? "• รอหัวหน้างานรับรอง"
                          : "• รอตรวจสภาพห้อง"}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap space-x-1">
                      {/* Print A4 button */}
                      <button
                        onClick={() => window.open(`/bookings/${b.bookingId}/print`, "_blank")}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        title="พิมพ์แบบคำขอ (A4)"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>พิมพ์ (A4)</span>
                      </button>

                      {/* Detail button */}
                      <button
                        onClick={() => setSelectedBookingId(b.bookingId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>รายละเอียด</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {total > limit && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              แสดงหน้า {page} จากทั้งหมด {totalPages} หน้า (รวม {total} รายการ)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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
