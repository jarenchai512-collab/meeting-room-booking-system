"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner, EmptyState } from "@/components/ui/LoadingSpinner";
import { BookingDetailModal } from "@/components/modals/BookingDetailModal";
import { RejectReasonModal } from "@/components/modals/RejectReasonModal";
import { useRealtimeEvents } from "@/lib/events/use-realtime";
import { useAuth } from "@/lib/auth/auth-context";
import { Booking } from "@/lib/data/types";
import { formatThaiDisplayDate } from "@/lib/utils/date";
import { Swal } from "@/lib/utils/sweetalert";
import {
  CheckSquare2,
  Check,
  Ban,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Printer,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

type ApprovalTab = "all_pending" | "stage_1_inspect" | "stage_2_endorse" | "stage_3_approve" | "history";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ApprovalTab>("all_pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Simulated Officer Role switcher for testing/demo
  const [activeOfficer, setActiveOfficer] = useState<string>(
    user?.role === "Inspector"
      ? "นายวัชรพงศ์ โสภา"
      : user?.role === "Endorser"
      ? "นายเอกราช เขียวทอง"
      : "นายชาตรี เริงชัยภูมิ"
  );

  // Action states
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
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
      fetchBookings();
    }
  });

  // Level 1: ตรวจสอบความพร้อมห้อง (นายวัชรพงศ์ โสภา)
  const handleInspectRoom = async (booking: Booking, ready: boolean) => {
    const note = prompt(
      ready
        ? "ระบุหมายเหตุการตรวจสภาพห้อง (ถ้ามี):"
        : "ระบุเหตุผลที่ห้องไม่พร้อมใช้งาน:",
      ready ? "ตรวจสภาพห้อง ระบบภาพ แสง สี เสียง และเครื่องปรับอากาศพร้อมใช้งาน 100%" : ""
    );

    if (note === null) return; // user cancelled prompt

    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${booking.bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "inspection",
          inspectionStatus: ready ? "ready" : "not_ready",
          inspectionNote: note.trim(),
        }),
      });

      if (res.ok) {
        await Swal.success(
          ready ? "บันทึกผล: พร้อมใช้งาน" : "บันทึกผล: ไม่พร้อมใช้งาน",
          `บันทึกผลการตรวจสอบห้องโดย นายวัชรพงศ์ โสภา เรียบร้อย`
        );
        await fetchBookings();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Level 2: หัวหน้างาน/ผู้รับรอง (นายเอกราช เขียวทอง)
  const handleEndorse = async (booking: Booking, endorsed: boolean) => {
    const confirmed = await Swal.confirm(
      endorsed ? "ยืนยันการลงนามรับรองคำขอ?" : "ไม่รับรองคำขอนี้?",
      `หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร (นายเอกราช เขียวทอง) ${
        endorsed ? "เห็นควรอนุญาตตามที่ขอ" : "ส่งคืนแก้ไข/ไม่รับรองคำขอ"
      }`,
      endorsed ? "ลงนามรับรอง" : "ไม่รับรอง"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${booking.bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "endorsement",
          endorsementStatus: endorsed ? "endorsed" : "rejected",
          endorsementNote: endorsed ? "เห็นควรอนุญาตตามที่ขอ" : "ไม่เป็นไปตามระเบียบ",
        }),
      });

      if (res.ok) {
        await Swal.success(
          endorsed ? "รับรองคำขอเรียบร้อย" : "ไม่รับรองคำขอ",
          "ส่งต่อรองผู้อำนวยการพิจารณาอนุมัติเรียบร้อย"
        );
        await fetchBookings();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Level 3: ผู้พิจารณาอนุมัติ (นายชาตรี เริงชัยภูมิ)
  const handleFinalApprove = async (booking: Booking) => {
    const confirmed = await Swal.confirm(
      "อนุมัติคำขอใช้ห้องประชุม?",
      `นายชาตรี เริงชัยภูมิ (รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน) อนุมัติการใช้ห้อง "${booking.roomName}" สำหรับ "${booking.title}"`,
      "อนุมัติ (คำขอสมบูรณ์)",
      "ยกเลิก"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${booking.bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
      if (res.ok) {
        await Swal.success(
          "อนุมัติคำขอเรียบร้อยสมบูรณ์!",
          "ระบบส่งการแจ้งเตือนและ Webhook ไปยังผู้ยื่นคำขอเรียบร้อยแล้ว"
        );
        await fetchBookings();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingBooking) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${rejectingBooking.bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Rejected",
          rejectionReason: reason,
        }),
      });
      if (res.ok) {
        setRejectingBooking(null);
        await Swal.error("บันทึกการไม่อนุมัติ/ปฏิเสธเรียบร้อย", `เหตุผล: ${reason}`);
        await fetchBookings();
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Groupings & Filter counts
  const stage1Count = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== "Cancelled" &&
          b.status !== "Rejected" &&
          (!b.inspectionStatus || b.inspectionStatus === "pending")
      ).length,
    [bookings]
  );

  const stage2Count = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== "Cancelled" &&
          b.status !== "Rejected" &&
          b.inspectionStatus === "ready" &&
          (!b.endorsementStatus || b.endorsementStatus === "pending")
      ).length,
    [bookings]
  );

  const stage3Count = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status !== "Cancelled" &&
          b.status !== "Rejected" &&
          b.status !== "Approved" &&
          b.endorsementStatus === "endorsed"
      ).length,
    [bookings]
  );

  const allPendingCount = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "Pending" || b.status === "Inspected" || b.status === "Endorsed"
      ).length,
    [bookings]
  );

  // Tab Filtering
  const displayedBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matches =
          b.title?.toLowerCase().includes(q) ||
          b.bookedBy?.toLowerCase().includes(q) ||
          b.roomName?.toLowerCase().includes(q) ||
          b.department?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (activeTab === "stage_1_inspect") {
        return (
          b.status !== "Cancelled" &&
          b.status !== "Rejected" &&
          (!b.inspectionStatus || b.inspectionStatus === "pending")
        );
      }
      if (activeTab === "stage_2_endorse") {
        return (
          b.status !== "Cancelled" &&
          b.status !== "Rejected" &&
          b.inspectionStatus === "ready" &&
          (!b.endorsementStatus || b.endorsementStatus === "pending")
        );
      }
      if (activeTab === "stage_3_approve") {
        return (
          b.status !== "Cancelled" &&
          b.status !== "Rejected" &&
          b.status !== "Approved" &&
          b.endorsementStatus === "endorsed"
        );
      }
      if (activeTab === "all_pending") {
        return (
          b.status === "Pending" ||
          b.status === "Inspected" ||
          b.status === "Endorsed"
        );
      }
      if (activeTab === "history") {
        return (
          b.status === "Approved" ||
          b.status === "Rejected" ||
          b.status === "Cancelled"
        );
      }
      return true;
    });
  }, [bookings, activeTab, searchTerm]);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            ระบบจัดการสถานะและการอนุมัติ 3 ระดับ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ตรวจห้อง: นายวัชรพงศ์ โสภา / รับรอง: นายเอกราช เขียวทอง / อนุมัติ: นายชาตรี เริงชัยภูมิ
          </p>
        </div>

        {/* Officer Persona Switcher for convenient testing & multi-level management */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-sm text-xs">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-700">สิทธิ์พิจารณาขณะนี้:</span>
          <select
            value={activeOfficer}
            onChange={(e) => setActiveOfficer(e.target.value)}
            className="font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none"
          >
            <option value="นายวัชรพงศ์ โสภา">1. นายวัชรพงศ์ โสภา (ตรวจห้อง)</option>
            <option value="นายเอกราช เขียวทอง">2. นายเอกราช เขียวทอง (รับรอง)</option>
            <option value="นายชาตรี เริงชัยภูมิ">3. นายชาตรี เริงชัยภูมิ (รอง ผอ. อนุมัติ)</option>
            <option value="Admin">ผู้ดูแลระบบ (เต็มสิทธิ์ทุกระดับ)</option>
          </select>
        </div>
      </div>

      {/* 3-Level Process Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              ระดับที่ 1: ตรวจสอบความพร้อมห้อง
            </span>
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1">นายวัชรพงศ์ โสภา</p>
          <p className="text-xs text-slate-500">เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร</p>
          <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600">รอตรวจห้อง:</span>
            <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
              {stage1Count} รายการ
            </span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              ระดับที่ 2: หัวหน้างาน/ผู้รับรอง
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1">นายเอกราช เขียวทอง</p>
          <p className="text-xs text-slate-500">หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร</p>
          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600">รอรับรอง:</span>
            <span className="font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
              {stage2Count} รายการ
            </span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              ระดับที่ 3: ผู้พิจารณาอนุมัติ
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1">นายชาตรี เริงชัยภูมิ</p>
          <p className="text-xs text-slate-500">รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน</p>
          <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-600">รออนุมัติขั้นสุดท้าย:</span>
            <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              {stage3Count} รายการ
            </span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab("all_pending")}
            className={`px-3 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "all_pending"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            รอพิจารณาทั้งหมด ({allPendingCount})
          </button>

          <button
            onClick={() => setActiveTab("stage_1_inspect")}
            className={`px-3 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "stage_1_inspect"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            1. รอตรวจห้อง ({stage1Count})
          </button>

          <button
            onClick={() => setActiveTab("stage_2_endorse")}
            className={`px-3 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "stage_2_endorse"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            2. รอรับรอง ({stage2Count})
          </button>

          <button
            onClick={() => setActiveTab("stage_3_approve")}
            className={`px-3 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "stage_3_approve"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            3. รออนุมัติ ({stage3Count})
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-2 rounded-xl font-semibold transition-all ${
              activeTab === "history"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            ประวัติการพิจารณา
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, แผนก, ห้อง..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Bookings List Cards */}
      {loading ? (
        <LoadingSpinner message="กำลังโหลดรายการคำขอ..." />
      ) : displayedBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckSquare2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่มีคำขอในหมวดนี้</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            คำขอจองห้องประชุมในหมวดนี้ได้รับการดำเนินการเรียบร้อยแล้ว
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map((b) => {
            const isStage1Pending = !b.inspectionStatus || b.inspectionStatus === "pending";
            const isStage2Pending = b.inspectionStatus === "ready" && (!b.endorsementStatus || b.endorsementStatus === "pending");
            const isStage3Pending = b.endorsementStatus === "endorsed" && b.status !== "Approved";

            return (
              <div
                key={b.bookingId}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={b.status} />
                    <span className="text-xs font-mono text-slate-400">ID: {b.bookingId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/bookings/print?id=${b.bookingId}`, "_blank")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-600" />
                      <span>พิมพ์ใบคำขอ (A4)</span>
                    </button>
                    <button
                      onClick={() => setSelectedBookingId(b.bookingId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรายละเอียด</span>
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-blue-700">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        {b.roomName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatThaiDisplayDate(b.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {b.startTime} - {b.endTime} น.
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {b.attendeesCount} คน
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 pt-1">
                      <span>ผู้ขอ: </span>
                      <strong className="text-slate-800">
                        {b.requesterPrefix ? `${b.requesterPrefix} ` : ""}
                        {b.bookedBy}
                      </strong>
                      <span className="text-slate-400"> • </span>
                      <span>{b.department}</span>
                      {b.phoneNumber && (
                        <>
                          <span className="text-slate-400"> • </span>
                          <span>โทร {b.phoneNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 3-Step Mini Visual Indicator */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center gap-2 self-start">
                    <div
                      className={`px-2 py-1 rounded-lg text-center ${
                        b.inspectionStatus === "ready"
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      1. ตรวจห้อง
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <div
                      className={`px-2 py-1 rounded-lg text-center ${
                        b.endorsementStatus === "endorsed"
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      2. รับรอง
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <div
                      className={`px-2 py-1 rounded-lg text-center ${
                        b.status === "Approved"
                          ? "bg-emerald-100 text-emerald-800 font-bold"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      3. อนุมัติ
                    </div>
                  </div>
                </div>

                {/* Action Buttons for each Stage */}
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold">สถานะการพิจารณา:</span>
                    {isStage1Pending && (
                      <span className="text-blue-700 font-bold">รอการตรวจสภาพห้อง (นายวัชรพงศ์ โสภา)</span>
                    )}
                    {isStage2Pending && (
                      <span className="text-amber-700 font-bold">ตรวจห้องแล้ว • รอหัวหน้างานรับรอง (นายเอกราช เขียวทอง)</span>
                    )}
                    {isStage3Pending && (
                      <span className="text-purple-700 font-bold">รับรองแล้ว • รอรอง ผอ. พิจารณาอนุมัติ (นายชาตรี เริงชัยภูมิ)</span>
                    )}
                    {b.status === "Approved" && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        อนุมัติเสร็จสมบูรณ์เรียบร้อย (โดย นายชาตรี เริงชัยภูมิ)
                      </span>
                    )}
                    {b.status === "Rejected" && (
                      <span className="text-rose-700 font-bold">
                        ปฏิเสธ/ไม่อนุมัติ: {b.rejectionReason}
                      </span>
                    )}
                  </div>

                  {/* Operational Action Buttons according to Active Officer */}
                  <div className="flex items-center gap-2">
                    {/* Stage 1 Actions */}
                    {isStage1Pending &&
                      (activeOfficer === "นายวัชรพงศ์ โสภา" || activeOfficer === "Admin") && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleInspectRoom(b, false)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold"
                          >
                            ห้องไม่พร้อม
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInspectRoom(b, true)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                          >
                            ✓ บันทึกตรวจห้องพร้อมใช้งาน
                          </button>
                        </>
                      )}

                    {/* Stage 2 Actions */}
                    {isStage2Pending &&
                      (activeOfficer === "นายเอกราช เขียวทอง" || activeOfficer === "Admin") && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEndorse(b, false)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold"
                          >
                            ไม่รับรอง
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEndorse(b, true)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                          >
                            ✍️ ลงนามรับรองคำขอ
                          </button>
                        </>
                      )}

                    {/* Stage 3 Actions */}
                    {isStage3Pending &&
                      (activeOfficer === "นายชาตรี เริงชัยภูมิ" || activeOfficer === "Admin") && (
                        <>
                          <button
                            type="button"
                            onClick={() => setRejectingBooking(b)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold"
                          >
                            ไม่อนุมัติ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFinalApprove(b)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                          >
                            ✓ อนุมัติการใช้ห้อง (ขั้นสุดท้าย)
                          </button>
                        </>
                      )}

                    {/* Override for Admin when pending */}
                    {activeOfficer === "Admin" &&
                      (b.status === "Pending" || b.status === "Inspected" || b.status === "Endorsed") &&
                      !isStage1Pending &&
                      !isStage2Pending &&
                      !isStage3Pending && (
                        <button
                          type="button"
                          onClick={() => handleFinalApprove(b)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                        >
                          ✓ อนุมัติทันที (Admin Override)
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedBookingId && (
        <BookingDetailModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onUpdated={fetchBookings}
        />
      )}

      <RejectReasonModal
        isOpen={Boolean(rejectingBooking)}
        onClose={() => setRejectingBooking(null)}
        bookingTitle={rejectingBooking?.title || ""}
        onConfirm={handleRejectConfirm}
      />
    </AppShell>
  );
}
