"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Paperclip,
  Check,
  Ban,
  Trash2,
  ExternalLink,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Booking } from "@/lib/data/types";
import { StatusBadge } from "../ui/StatusBadge";
import { formatThaiDisplayDate } from "@/lib/utils/date";
import { useAuth } from "@/lib/auth/auth-context";
import { RejectReasonModal } from "./RejectReasonModal";
import { Swal } from "@/lib/utils/sweetalert";

interface BookingDetailModalProps {
  bookingId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [bookingId]);

  const handleApprove = async () => {
    const confirmed = await Swal.confirm(
      "ยืนยันการอนุมัติคำขอการจอง?",
      `ต้องการอนุมัติการใช้ห้อง "${booking?.roomName}" สำหรับ "${booking?.title}" ใช่หรือไม่?`,
      "อนุมัติทันที",
      "ยกเลิก"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });
      if (res.ok) {
        await Swal.success("อนุมัติเรียบร้อย", "ส่งการแจ้งเตือนและข้อความ Webhook เรียบร้อยแล้ว");
        await fetchDetail();
        if (onUpdated) onUpdated();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected", rejectionReason: reason }),
      });
      if (res.ok) {
        await Swal.error("ปฏิเสธคำขอเรียบร้อย", `เหตุผล: ${reason}`);
        await fetchDetail();
        if (onUpdated) onUpdated();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await Swal.confirm(
      "ยืนยันการยกเลิกการจอง?",
      "ข้อมูลจะถูกปรับเป็นสถานะยกเลิก (Cancelled)",
      "ยืนยันยกเลิก",
      "ปิด"
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await Swal.warning("ยกเลิกการจองเรียบร้อย");
        await fetchDetail();
        if (onUpdated) onUpdated();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.open(`/bookings/${bookingId}/print`, "_blank");
  };

  if (loading || !booking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <p className="text-sm text-slate-500">กำลังโหลดรายละเอียด...</p>
        </div>
      </div>
    );
  }

  const isElevated =
    user?.role === "Admin" ||
    user?.role === "Approver" ||
    user?.role === "Inspector" ||
    user?.role === "Endorser";
  const isOwner = user?.email === booking.bookedByEmail;
  const canApprove =
    isElevated && (booking.status === "Pending" || booking.status === "Inspected" || booking.status === "Endorsed");
  const canCancel =
    user?.role === "Admin" || (isOwner && booking.status !== "Cancelled" && booking.status !== "Rejected");

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-3">
              <StatusBadge status={booking.status} />
              <span className="text-xs text-slate-400 font-mono">ID: {booking.bookingId}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์แบบคำขอ (A4)</span>
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-sm">
            {/* Title & Basic Meta */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{booking.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1 font-semibold text-blue-700">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {booking.roomName}
                  {booking.otherRoomDetail ? ` (${booking.otherRoomDetail})` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatThaiDisplayDate(booking.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {booking.startTime} - {booking.endTime} น.
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {booking.attendeesCount} คน
                </span>
              </div>
            </div>

            {/* 3-Stage Approval Flow Status Cards */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  ขั้นตอนการตรวจสอบและพิจารณาอนุมัติ 3 ระดับ
                </span>
                <span className="text-[11px] text-slate-500">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {/* Stage 1: นายวัชรพงศ์ โสภา */}
                <div
                  className={`p-3 rounded-xl border ${
                    booking.inspectionStatus === "ready"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : booking.inspectionStatus === "not_ready"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">1. ผู้ตรวจสอบห้อง</span>
                    {booking.inspectionStatus === "ready" ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        พร้อมใช้งาน
                      </span>
                    ) : booking.inspectionStatus === "not_ready" ? (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                        ไม่พร้อม
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                        รอตรวจห้อง
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-slate-800 text-[11px]">
                    {booking.inspectionInspector || "นายวัชรพงศ์ โสภา"}
                  </p>
                  <p className="text-[10px] text-slate-500">เจ้าหน้าที่ศูนย์ดิจิทัลฯ</p>
                  {booking.inspectionNote && (
                    <p className="text-[10px] mt-1 text-slate-600 italic">
                      &quot;{booking.inspectionNote}&quot;
                    </p>
                  )}
                </div>

                {/* Stage 2: นายเอกราช เขียวทอง */}
                <div
                  className={`p-3 rounded-xl border ${
                    booking.endorsementStatus === "endorsed"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : booking.endorsementStatus === "rejected"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">2. หัวหน้างาน/ผู้รับรอง</span>
                    {booking.endorsementStatus === "endorsed" ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        รับรองแล้ว
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                        รอรับรอง
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-slate-800 text-[11px]">
                    {booking.endorserName || "นายเอกราช เขียวทอง"}
                  </p>
                  <p className="text-[10px] text-slate-500">หัวหน้างานศูนย์ดิจิทัลฯ</p>
                  {booking.endorsementDate && (
                    <p className="text-[10px] mt-1 text-slate-500">{booking.endorsementDate}</p>
                  )}
                </div>

                {/* Stage 3: นายชาตรี เริงชัยภูมิ */}
                <div
                  className={`p-3 rounded-xl border ${
                    booking.status === "Approved"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : booking.status === "Rejected"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">3. ผู้พิจารณาอนุมัติ</span>
                    {booking.status === "Approved" ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        อนุมัติแล้ว
                      </span>
                    ) : booking.status === "Rejected" ? (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                        ไม่อนุมัติ
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]">
                        รอพิจารณา
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-semibold text-slate-800 text-[11px]">
                    {booking.approvedBy || "นายชาตรี เริงชัยภูมิ"}
                  </p>
                  <p className="text-[10px] text-slate-500">รอง ผอ. ฝ่ายยุทธศาสตร์ฯ</p>
                  {booking.approvedAt && (
                    <p className="text-[10px] mt-1 text-slate-500">
                      {new Date(booking.approvedAt).toLocaleDateString("th-TH")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Alert if Rejected */}
            {booking.status === "Rejected" && booking.rejectionReason && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <p className="font-semibold text-rose-900">เหตุผลที่ไม่อนุมัติ/ปฏิเสธ:</p>
                <p className="mt-1">{booking.rejectionReason}</p>
              </div>
            )}

            {/* Requester Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <p className="text-slate-400 uppercase font-semibold">ผู้ยื่นคำขอ</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">
                  {booking.requesterPrefix ? `${booking.requesterPrefix} ` : ""}
                  {booking.bookedBy}
                </p>
                <p className="text-slate-500">{booking.position || "บุคลากร"}</p>
                <p className="text-slate-500">{booking.bookedByEmail}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase font-semibold">หน่วยงาน / สาขาวิชา</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{booking.department}</p>
                <p className="text-slate-500">โทรศัพท์: {booking.phoneNumber || "ไม่ระบุ"}</p>
                <p className="text-slate-400 mt-1">เขียนวันที่: {booking.writtenDate || "-"}</p>
              </div>
            </div>

            {/* Equipment Checklist */}
            {booking.equipment && booking.equipment.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  ครุภัณฑ์และสิ่งอำนวยความสะดวกที่ขอใช้ (6 รายการ)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {booking.equipment.map((eq, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium"
                    >
                      {eq}
                    </span>
                  ))}
                  {booking.tableChairCount ? (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                      โต๊ะ/เก้าอี้เพิ่มเติม: {booking.tableChairCount} ตัว
                    </span>
                  ) : null}
                  {booking.otherEquipment && (
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-medium">
                      อื่นๆ: {booking.otherEquipment}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Notes & File Attachment */}
            {booking.notes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase">หมายเหตุเพิ่มเติม</h4>
                <p className="text-slate-700 mt-1 whitespace-pre-line text-xs">{booking.notes}</p>
              </div>
            )}

            {booking.fileAttachmentUrl && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1.5">เอกสารแนบ</h4>
                <a
                  href={booking.fileAttachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-medium text-slate-700 transition-colors border border-slate-200"
                >
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>{booking.fileName || "เปิดดูเอกสารประกอบ (Google Drive)"}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ยกเลิกการจอง
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                ปิดหน้าต่าง
              </button>

              {canApprove && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    ปฏิเสธคำขอ
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    อนุมัติการจอง
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        bookingTitle={booking.title}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
};
