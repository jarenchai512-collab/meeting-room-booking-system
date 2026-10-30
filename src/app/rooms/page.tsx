"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RoomFormModal } from "@/components/modals/RoomFormModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth/auth-context";
import { useRealtimeEvents } from "@/lib/events/use-realtime";
import { Room } from "@/lib/data/types";
import {
  DoorOpen,
  PlusCircle,
  Users,
  MapPin,
  Edit2,
  PowerOff,
  Power,
  CalendarPlus,
  Sparkles,
} from "lucide-react";

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const isAdmin = user?.role === "Admin";

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms?all=true");
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  useRealtimeEvents((event) => {
    if (event.type === "room_updated") {
      fetchRooms();
    }
  });

  const handleToggleStatus = async (room: Room) => {
    const nextStatus = !room.isAvailable;
    const actionText = nextStatus ? "เปิดให้ใช้งาน" : "ปิดปรับปรุง";
    if (!confirm(`คุณต้องการ${actionText}ห้อง "${room.name}" ใช่หรือไม่?`)) return;

    try {
      await fetch(`/api/rooms/${room.roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: nextStatus }),
      });
      await fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ห้องประชุมทั้งหมด</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            รายการห้องประชุม อุปกรณ์ประจำห้อง ความจุ และสถานะความพร้อมใช้งาน
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>เพิ่มห้องประชุมใหม่</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="กำลังโหลดข้อมูลห้องประชุม..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex flex-col ${
                !room.isAvailable ? "border-slate-200 opacity-75 bg-slate-50/50" : "border-slate-200/90"
              }`}
            >
              {/* Header with color indicator */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: room.color || "#2563EB" }}
              />

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {room.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0 ${
                      room.isAvailable
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {room.isAvailable ? "พร้อมใช้งาน" : "ปิดปรับปรุง"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {room.building} {room.floor}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    จุได้ {room.capacity} คน
                  </span>
                </div>

                {room.description && (
                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Equipment badges */}
                <div className="mt-auto pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase mb-2">
                    อุปกรณ์ประจำห้อง
                  </p>
                  <div className="flex flex-wrap gap-1.5 min-h-12">
                    {room.equipmentList?.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {room.isAvailable ? (
                    <Link
                      href={`/bookings/new?roomId=${room.roomId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-xl transition-colors"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>จองห้องนี้</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">ปิดให้จอง</span>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(room)}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          room.isAvailable
                            ? "text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={room.isAvailable ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                      >
                        {room.isAvailable ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(room)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="แก้ไขข้อมูลห้อง"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={editingRoom}
        onSaved={fetchRooms}
      />
    </AppShell>
  );
}
