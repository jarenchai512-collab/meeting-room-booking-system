"use client";

import React, { useState, useEffect } from "react";
import { X, DoorOpen } from "lucide-react";
import { Room } from "@/lib/data/types";

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  onSaved: () => void;
}

const COMMON_EQUIPMENT = [
  "Projector 4K",
  "Smart TV",
  "Video Conference",
  "Soundbar / ลำโพง",
  "ไมโครโฟนไร้สาย",
  "ไมค์ประจำที่",
  "Whiteboard",
  "Smart Board",
  "ปลั๊กไฟตั้งโต๊ะ",
  "ระบบแปลภาษา",
];

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isOpen,
  onClose,
  room,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("อาคารบริหาร");
  const [floor, setFloor] = useState("ชั้น 2");
  const [capacity, setCapacity] = useState(10);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [color, setColor] = useState("#2563EB");
  const [description, setDescription] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (room) {
      setName(room.name);
      setBuilding(room.building);
      setFloor(room.floor);
      setCapacity(room.capacity);
      setEquipmentList(room.equipmentList || []);
      setColor(room.color || "#2563EB");
      setDescription(room.description || "");
      setIsAvailable(room.isAvailable);
    } else {
      setName("");
      setBuilding("อาคารบริหาร");
      setFloor("ชั้น 2");
      setCapacity(10);
      setEquipmentList(["Projector 4K", "Whiteboard"]);
      setColor("#2563EB");
      setDescription("");
      setIsAvailable(true);
    }
  }, [room, isOpen]);

  if (!isOpen) return null;

  const toggleEquipment = (eq: string) => {
    setEquipmentList((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อห้องประชุม");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name,
        building,
        floor,
        capacity: Number(capacity),
        equipmentList,
        color,
        description,
        isAvailable,
      };

      const url = room ? `/api/rooms/${room.roomId}` : "/api/rooms";
      const method = room ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "บันทึกห้องประชุมไม่สำเร็จ");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <DoorOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-base">
              {room ? "แก้ไขข้อมูลห้องประชุม" : "เพิ่มห้องประชุมใหม่"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อห้องประชุม <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ห้องประชุมเจ้าพระยา"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">อาคาร</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชั้น</label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ความจุสูงสุด (คน) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">สีประจำห้อง</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 p-0 border border-slate-300 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-mono">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              อุปกรณ์ประจำห้อง
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
              {COMMON_EQUIPMENT.map((eq) => (
                <label key={eq} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={equipmentList.includes(eq)}
                    onChange={() => toggleEquipment(eq)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{eq}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAvailable"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="isAvailable" className="text-xs font-medium text-slate-700 cursor-pointer">
              เปิดให้ใช้งานและจองห้องนี้
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
