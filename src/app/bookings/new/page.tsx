"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Room, Booking } from "@/lib/data/types";
import { Swal } from "@/lib/utils/sweetalert";
import {
  Calendar,
  Clock,
  DoorOpen,
  Users,
  Paperclip,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Phone,
  Building,
  User,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { isValidTimeInterval, isTimeRangeOverlapping, toBangkokIso } from "@/lib/utils/date";

// The 6 official rooms of Thaluang Cement Thai Anusorn Technical College
const OFFICIAL_ROOMS = [
  { id: "room_01", name: "หอประชุมอดิเรกสาร", capacity: 500, color: "#2563EB" },
  { id: "room_02", name: "ห้องประชุมสักทอง", capacity: 60, color: "#D97706" },
  { id: "room_03", name: "ห้องประชุมหน้าห้องผู้อำนวยการ", capacity: 25, color: "#059669" },
  { id: "room_04", name: "ห้องประชุม (กาแฟ)", capacity: 15, color: "#E11D48" },
  { id: "room_05", name: "อาคารโดมเอนกประสงค์", capacity: 1000, color: "#0891B2" },
  { id: "room_06", name: "ห้องคอมพิวเตอร์กลาง (ห้องโสต)", capacity: 45, color: "#7C3AED" },
  { id: "room_other", name: "อื่นๆ", capacity: 100, color: "#64748B" },
];

// The 6 standard equipment items from the official form
const STANDARD_EQUIPMENT = [
  "เครื่องฉายภาพ (Projector)",
  "ระบบเสียง",
  "ไมโครโฟน",
  "เครื่องปรับอากาศ",
  "อินเทอร์เน็ต",
  "โต๊ะ/เก้าอี้เพิ่มเติม",
];

const DEPARTMENTS = [
  "แผนกวิชาช่างยนต์",
  "แผนกวิชาช่างกลโรงงาน",
  "แผนกวิชาช่างเชื่อมโลหะ",
  "แผนกวิชาไฟฟ้ากำลัง",
  "แผนกวิชาอิเล็กทรอนิกส์",
  "แผนกวิชาการบัญชี",
  "แผนกวิชาการตลาด",
  "แผนกวิชาเทคโนโลยีธุรกิจดิจิทัล",
  "แผนกวิชาสามัญสัมพันธ์",
  "งานศูนย์ดิจิทัลและสื่อสารองค์กร",
  "ฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
  "ฝ่ายวิชาการ",
  "ฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
  "ฝ่ายบริหารทรัพยากร",
];

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Form Fields
  const [writtenDate, setWrittenDate] = useState(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date())
  );
  const [requesterPrefix, setRequesterPrefix] = useState<string>((user as any)?.prefix || "นาย");
  const [bookedBy, setBookedBy] = useState(user?.name || "");
  const [position, setPosition] = useState((user as any)?.position || "");
  const [department, setDepartment] = useState(user?.department || "แผนกวิชาช่างยนต์");
  const [phoneNumber, setPhoneNumber] = useState((user as any)?.phoneNumber || "");

  // Room
  const [roomId, setRoomId] = useState(searchParams.get("roomId") || "room_01");
  const [otherRoomDetail, setOtherRoomDetail] = useState("");

  // Purpose & Title
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState("");

  // Schedule
  const [startDate, setStartDate] = useState(
    searchParams.get("date") ||
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date())
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("date") ||
      new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date())
  );
  const [startTime, setStartTime] = useState(searchParams.get("startTime") || "09:00");
  const [endTime, setEndTime] = useState(searchParams.get("endTime") || "12:00");
  const [attendeesCount, setAttendeesCount] = useState<number>(30);

  // Equipment & Extras
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    "เครื่องฉายภาพ (Projector)",
    "ระบบเสียง",
    "เครื่องปรับอากาศ",
  ]);
  const [hasTableChair, setHasTableChair] = useState(false);
  const [tableChairCount, setTableChairCount] = useState<number>(10);
  const [hasOtherEquipment, setHasOtherEquipment] = useState(false);
  const [otherEquipment, setOtherEquipment] = useState("");

  // Confirmation Checkbox
  const [assetAgreementConfirmed, setAssetAgreementConfirmed] = useState(false);
  const [notes, setNotes] = useState("");

  // Attachment State
  const [uploadedAttachment, setUploadedAttachment] = useState<{
    fileUrl: string;
    fileId: string;
    fileName: string;
  } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user?.name && !bookedBy) setBookedBy(user.name);
    if (user?.department && (!department || department === "ไม่ระบุ")) setDepartment(user.department);
    if ((user as any)?.position && !position) setPosition((user as any).position);
    if ((user as any)?.phoneNumber && !phoneNumber) setPhoneNumber((user as any).phoneNumber);
    if ((user as any)?.prefix && !requesterPrefix) setRequesterPrefix((user as any).prefix);
  }, [user]);

  useEffect(() => {
    async function loadData() {
      try {
        const [resRooms, resBookings] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/bookings"),
        ]);
        if (resRooms.ok) {
          const d = await resRooms.json();
          setRooms(d.rooms?.length > 0 ? d.rooms : OFFICIAL_ROOMS as any);
        }
        if (resBookings.ok) {
          const d = await resBookings.json();
          setExistingBookings(d.bookings || []);
        }
      } finally {
        setLoadingRooms(false);
      }
    }
    loadData();
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.roomId === roomId) || OFFICIAL_ROOMS.find((r) => r.id === roomId);
  }, [rooms, roomId]);

  // Validation Warnings
  const capacityExceeded =
    selectedRoom && roomId !== "room_other" && attendeesCount > (selectedRoom.capacity || 100);
  const timeInvalid = !isValidTimeInterval(startTime, endTime);

  // Client-side Conflict Detection (ระบบเช็กเวลาชนกัน)
  const conflict = useMemo(() => {
    if (!roomId || !startDate || !startTime || !endTime || timeInvalid) return null;
    const startIso = toBangkokIso(startDate, startTime);
    const endIso = toBangkokIso(startDate, endTime);

    return existingBookings.find((b) => {
      if (b.status === "Cancelled" || b.status === "Rejected") return false;
      if (b.roomId !== roomId) return false;
      if (b.date !== startDate) return false;
      return isTimeRangeOverlapping(startIso, endIso, b.startDateTime, b.endDateTime);
    });
  }, [existingBookings, roomId, startDate, startTime, endTime, timeInvalid]);

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage("ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ที่เล็กลง");
      return;
    }

    setUploadingFile(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selected);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");

      setUploadedAttachment({
        fileUrl: data.fileUrl,
        fileId: data.fileId,
        fileName: data.fileName,
      });
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (timeInvalid) {
      setErrorMessage("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นเสมอ");
      return;
    }

    if (!assetAgreementConfirmed) {
      setErrorMessage(
        "กรุณาคลิกยอมรับข้อความรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการ ก่อนกดส่งคำขอ"
      );
      return;
    }

    // SweetAlert2 Conflict Prevention Alert
    if (conflict) {
      await Swal.conflictAlert(
        selectedRoom?.name || "ห้องประชุม",
        `${startDate} เวลา ${startTime} - ${endTime} น.`,
        `การประชุม "${conflict.title}" โดย ${conflict.bookedBy} (${conflict.startTime} - ${conflict.endTime} น.)`
      );
      return;
    }

    if (capacityExceeded) {
      const proceed = await Swal.confirm(
        "จำนวนผู้เข้าร่วมเกินความจุห้อง",
        `ห้อง ${selectedRoom?.name} จุได้ ${selectedRoom?.capacity} คน แต่คุณระบุ ${attendeesCount} คน ต้องการยืนยันส่งต่อหรือไม่?`
      );
      if (!proceed) return;
    }

    try {
      setSubmitting(true);
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Final equipment array
      const equipmentToSave = [...selectedEquipment];
      if (hasTableChair && !equipmentToSave.includes("โต๊ะ/เก้าอี้เพิ่มเติม")) {
        equipmentToSave.push("โต๊ะ/เก้าอี้เพิ่มเติม");
      }
      if (hasOtherEquipment && !equipmentToSave.includes("อื่น ๆ")) {
        equipmentToSave.push("อื่น ๆ");
      }

      const payload = {
        roomId,
        title: title.trim(),
        requesterPrefix,
        bookedBy: bookedBy.trim(),
        position: position.trim(),
        department: department.trim(),
        phoneNumber: phoneNumber.trim(),
        writtenDate,
        date: startDate,
        endDate: endDate || startDate,
        startTime,
        endTime,
        attendeesCount: Number(attendeesCount),
        purpose: purpose.trim() || title.trim(),
        otherRoomDetail: roomId === "room_other" ? otherRoomDetail.trim() : "",
        equipment: equipmentToSave,
        tableChairCount: hasTableChair ? Number(tableChairCount) : 0,
        otherEquipment: hasOtherEquipment ? otherEquipment.trim() : "",
        assetAgreementConfirmed: true,
        notes: notes.trim(),
        fileAttachmentUrl: uploadedAttachment?.fileUrl || "",
        fileAttachmentId: uploadedAttachment?.fileId || "",
        fileName: uploadedAttachment?.fileName || "",
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          await Swal.conflictAlert(
            selectedRoom?.name || "ห้องประชุม",
            `${startDate} เวลา ${startTime} - ${endTime} น.`,
            data.error || "มีรายการจองซ้อนทับกัน"
          );
          return;
        }
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกการจอง");
      }

      await Swal.success(
        "ส่งคำขอจองห้องประชุมเรียบร้อย!",
        `บันทึกคำขอ "${title}" เข้าสู่กระบวนการพิจารณา 3 ระดับเรียบร้อยแล้ว`
      );

      router.push("/bookings");
    } catch (err: any) {
      setErrorMessage(err.message);
      Swal.error("เกิดข้อผิดพลาด", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ย้อนกลับ</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white text-lg border border-white/20">
              🏛️
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                แบบคำขออนุญาตใช้ห้องประชุม
              </h1>
              <p className="text-xs text-blue-100 mt-0.5">
                วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ • งานศูนย์ดิจิทัลและสื่อสารองค์กร
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
          {/* Top Alert & Conflict Warning */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="font-bold">ไม่สามารถส่งคำขอได้:</strong> {errorMessage}
              </div>
            </div>
          )}

          {conflict && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ ตรวจพบเวลาใช้งานห้องซ้อนทับกัน (Conflict Detection)</p>
                <p className="mt-1">
                  ห้อง &quot;{selectedRoom?.name}&quot; ในวันที่ {startDate} มีผู้จองแล้ว:{" "}
                  <strong>{conflict.title}</strong> ({conflict.startTime} - {conflict.endTime} น.) โดย{" "}
                  {conflict.bookedBy} ({conflict.department})
                </p>
                <p className="text-amber-700 mt-1 font-semibold">
                  กรุณาเปลี่ยนเวลา หรือเลือกห้องประชุมอื่น
                </p>
              </div>
            </div>
          )}

          {/* Section 1: ข้อมูลผู้ยื่นคำขอ */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                ส่วนที่ 1: ข้อมูลผู้ยื่นคำขอและสังกัด
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">เขียนวันที่:</span>
                <input
                  type="date"
                  value={writtenDate}
                  onChange={(e) => setWrittenDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  คำนำหน้า <span className="text-rose-500">*</span>
                </label>
                <select
                  value={requesterPrefix}
                  onChange={(e) => setRequesterPrefix(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ผู้ยื่นคำขอ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bookedBy}
                  onChange={(e) => setBookedBy(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 mb-1">
                  ตำแหน่ง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="เช่น ครู ชำนาญการพิเศษ, หัวหน้างาน..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-7">
                <label className="block font-semibold text-slate-700 mb-1">
                  หน่วยงาน / สาขาวิชา <span className="text-rose-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 mb-1">
                  หมายเลขโทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="เช่น 081-456-7890"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: เลือกห้องประชุม (6 ห้องหลัก + อื่นๆ) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                ส่วนที่ 2: เลือกห้องประชุม (6 ห้องหลักของวิทยาลัย) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500">เลือก 1 สถานที่</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {OFFICIAL_ROOMS.map((r) => {
                const isSelected = roomId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setRoomId(r.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                      </div>
                      <input
                        type="radio"
                        name="meeting_room"
                        checked={isSelected}
                        onChange={() => setRoomId(r.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {r.id === "room_other"
                        ? "ระบุสถานที่เพิ่มเติมด้านล่าง"
                        : `ความจุสูงสุด ${r.capacity} คน`}
                    </p>
                  </div>
                );
              })}
            </div>

            {roomId === "room_other" && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  โปรดระบุห้องประชุมหรือสถานที่อื่น ๆ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={roomId === "room_other"}
                  value={otherRoomDetail}
                  onChange={(e) => setOtherRoomDetail(e.target.value)}
                  placeholder="เช่น ห้องประชุมแผนกวิชาช่างกล, ลานหน้าเสาธง, ห้องศูนย์บ่มเพาะ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Section 3: หัวข้อและวัตถุประสงค์ */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                เพื่อใช้ในการดำเนินงาน เรื่อง (หัวข้อการประชุม/กิจกรรม){" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น การประชุมสัมมนาเตรียมความพร้อมแข่งขันทักษะวิชาชีพ, ประชุมคณะกรรมการสถานศึกษา..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วัตถุประสงค์โดยสังเขป (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ระบุวาระการประชุมหรือกลุ่มเป้าหมาย..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Section 4: กำหนดการใช้งานวันและเวลา */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              ส่วนที่ 3: กำหนดการใช้งานวัน-เวลา และจำนวนคน
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ตั้งแต่วันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ถึงวันที่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ตั้งแต่เวลา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ถึงเวลา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  จำนวนคน (โดยประมาณ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 ${
                    capacityExceeded ? "border-rose-400 bg-rose-50" : "border-slate-300"
                  }`}
                />
              </div>
            </div>

            {capacityExceeded && (
              <p className="text-xs text-rose-600 font-semibold">
                คำเตือน: จำนวนผู้เข้าใช้ ({attendeesCount} คน) เกินความจุของห้อง ({selectedRoom?.capacity} คน)
              </p>
            )}
          </div>

          {/* Section 5: ครุภัณฑ์/อุปกรณ์/สิ่งอำนวยความสะดวกที่ขอใช้ (6 รายการ + โต๊ะเก้าอี้ + อื่นๆ) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-800">
                ส่วนที่ 4: ครุภัณฑ์/อุปกรณ์/สิ่งอำนวยความสะดวกที่ขอใช้ (ครบ 6 รายการตามแบบฟอร์ม)
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {STANDARD_EQUIPMENT.slice(0, 5).map((eq) => {
                const checked = selectedEquipment.includes(eq);
                return (
                  <label
                    key={eq}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors ${
                      checked
                        ? "bg-blue-50 border-blue-400 text-blue-800 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEquipment(eq)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{eq}</span>
                  </label>
                );
              })}

              {/* รายการที่ 6: โต๊ะ/เก้าอี้เพิ่มเติม พร้อมช่องกรอกตัวเลข */}
              <div
                className={`p-3 rounded-2xl border transition-colors ${
                  hasTableChair
                    ? "bg-blue-50 border-blue-400 text-blue-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTableChair}
                    onChange={(e) => setHasTableChair(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>โต๊ะ/เก้าอี้เพิ่มเติม</span>
                </label>
                {hasTableChair && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={tableChairCount}
                      onChange={(e) => setTableChairCount(Number(e.target.value))}
                      className="w-20 px-2 py-1 text-xs border border-blue-300 rounded-lg bg-white"
                    />
                    <span className="text-xs text-slate-600">ตัว</span>
                  </div>
                )}
              </div>
            </div>

            {/* อุปกรณ์อื่นๆ เพิ่มเติม */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOtherEquipment}
                  onChange={(e) => setHasOtherEquipment(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>ครุภัณฑ์หรือสิ่งอำนวยความสะดวกอื่น ๆ (ระบุ)</span>
              </label>
              {hasOtherEquipment && (
                <input
                  type="text"
                  value={otherEquipment}
                  onChange={(e) => setOtherEquipment(e.target.value)}
                  placeholder="เช่น แท่นบรรยาย (โพเดียม), ปลั๊กไฟพ่วง 3 ชุด, ระบบถ่ายทอดสด Live..."
                  className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* Section 6: หมายเหตุและเอกสารแนบ */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติมสำหรับการจัดห้อง (ถ้ามี)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ต้องการจัดโต๊ะแบบ U-Shape, ขอเปิดเครื่องปรับอากาศล่วงหน้า 30 นาที..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Google Drive File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เอกสารประกอบคำขอ (โครงการ / กำหนดการ / รายชื่อ)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50/60 hover:bg-slate-50 transition-colors">
                {uploadedAttachment ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-semibold">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <span>อัปโหลดเรียบร้อย: {uploadedAttachment.fileName}</span>
                    <button
                      type="button"
                      onClick={() => setUploadedAttachment(null)}
                      className="text-xs text-rose-600 underline ml-2"
                    >
                      นำออก
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                    <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700">
                      <span>{uploadingFile ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกไฟล์แนบ"}</span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      รองรับ PDF, Word, Excel, PowerPoint และรูปภาพ ขนาดไม่เกิน 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 7: Mandatory Checkbox ยืนยันการดูแลรักษาทรัพย์สิน */}
          <div className="p-4 bg-emerald-50/80 border-2 border-emerald-300/80 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={assetAgreementConfirmed}
                onChange={(e) => setAssetAgreementConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs text-emerald-950 leading-relaxed font-semibold">
                <span className="text-rose-600 font-bold">* คำรับรองตามระเบียบราชการ: </span>
                ข้าพเจ้าขอรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการ และปฏิบัติตามระเบียบของวิทยาลัยโดยเคร่งครัด
              </div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {conflict ? (
                <span className="text-amber-600 font-semibold">
                  ⚠️ เวลาที่เลือกซ้อนทับกับการจองอื่น กรุณาปรับเปลี่ยนเวลาก่อนส่ง
                </span>
              ) : (
                <span>ตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting || timeInvalid || !assetAgreementConfirmed}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {submitting ? "กำลังส่งคำขอ..." : "ยืนยันส่งคำขออนุญาตใช้ห้องประชุม"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSpinner message="กำลังเตรียมแบบฟอร์มการจอง..." />}>
        <BookingFormContent />
      </Suspense>
    </AppShell>
  );
}
