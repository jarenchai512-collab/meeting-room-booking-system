"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BookingDetailModal } from "@/components/modals/BookingDetailModal";
import { useRealtimeEvents } from "@/lib/events/use-realtime";
import { Booking, Room } from "@/lib/data/types";
import { CalendarDays, Filter, PlusCircle, Search, RefreshCw } from "lucide-react";

// Dynamically import FullCalendar client-side
const BookingCalendar = dynamic(
  () =>
    import("@/components/calendar/BookingCalendar").then(
      (mod) => mod.BookingCalendar
    ),
  {
    ssr: false,
    loading: () => <LoadingSpinner message="กำลังเตรียมปฏิทินห้องประชุม FullCalendar..." />,
  }
);

export default function CalendarPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Filters
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchDepartmentKeyword, setSearchDepartmentKeyword] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRooms, resBookings] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/bookings"),
      ]);
      if (resRooms.ok) {
        const d = await resRooms.json();
        setRooms(d.rooms || []);
      }
      if (resBookings.ok) {
        const d = await resBookings.json();
        setBookings(d.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const departments = useMemo(() => {
    return Array.from(new Set(bookings.map((b) => b.department).filter(Boolean)));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (selectedRoomId !== "all" && b.roomId !== selectedRoomId) return false;
      if (selectedDepartment !== "all" && b.department !== selectedDepartment) return false;
      if (searchDepartmentKeyword.trim()) {
        const q = searchDepartmentKeyword.toLowerCase();
        const deptMatch = b.department?.toLowerCase().includes(q);
        const titleMatch = b.title?.toLowerCase().includes(q);
        const bookedByMatch = b.bookedBy?.toLowerCase().includes(q);
        if (!deptMatch && !titleMatch && !bookedByMatch) return false;
      }
      return true;
    });
  }, [bookings, selectedRoomId, selectedDepartment, searchDepartmentKeyword]);

  const handleSelectSlot = (slot: { date: string; startTime: string; endTime: string }) => {
    const params = new URLSearchParams({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    if (selectedRoomId !== "all") {
      params.set("roomId", selectedRoomId);
    }
    router.push(`/bookings/new?${params.toString()}`);
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-blue-600" />
            ปฏิทินห้องประชุม (FullCalendar)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            แยกสีตามห้องประชุม 6 ห้องหลัก พร้อมตัวกรองรายห้องและค้นหาตามแผนกวิชา
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-600 transition-colors shadow-sm"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push("/bookings/new")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ยื่นคำขอจองห้อง</span>
          </button>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>ตัวกรอง:</span>
            </div>

            {/* Room Filter */}
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกห้องประชุม (6 ห้องหลัก)</option>
              {rooms.map((r) => (
                <option key={r.roomId} value={r.roomId}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทุกแผนกวิชา</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search by Department Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchDepartmentKeyword}
              onChange={(e) => setSearchDepartmentKeyword(e.target.value)}
              placeholder="ค้นหาตามแผนกวิชา / ผู้ขอ..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Room Color Legend (All 6 Official Rooms) */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <span className="text-slate-500 font-semibold text-[11px]">สีประจำห้อง:</span>
          {rooms.map((r) => (
            <div
              key={r.roomId}
              onClick={() => setSelectedRoomId(selectedRoomId === r.roomId ? "all" : r.roomId)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                selectedRoomId === r.roomId ? "bg-slate-100 ring-1 ring-slate-300 font-bold" : "hover:bg-slate-50"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-slate-700 text-[11px]">{r.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 text-[11px]">รออนุมัติ</span>
          </div>
        </div>
      </div>

      {/* FullCalendar Component */}
      <BookingCalendar
        bookings={filteredBookings}
        rooms={rooms}
        onSelectBooking={(id) => setSelectedBookingId(id)}
        onSelectDateSlot={handleSelectSlot}
      />

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
