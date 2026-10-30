"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BookingTrendsChart } from "@/components/charts/BookingTrendsChart";
import { RoomUtilizationChart } from "@/components/charts/RoomUtilizationChart";
import { DepartmentRankingChart } from "@/components/charts/DepartmentRankingChart";
import { useAuth } from "@/lib/auth/auth-context";
import {
  exportBookingsToCsv,
  exportBookingsToExcel,
  exportBookingsToPdf,
} from "@/lib/utils/export";
import { Booking, Room } from "@/lib/data/types";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [roomId, setRoomId] = useState("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (roomId !== "all") params.set("roomId", roomId);

      const [resReport, resBookings, resRooms] = await Promise.all([
        fetch(`/api/reports?${params.toString()}`),
        fetch(`/api/bookings?${params.toString()}`),
        fetch("/api/rooms"),
      ]);

      if (resReport.ok) {
        const d = await resReport.json();
        setReportData(d);
      }
      if (resBookings.ok) {
        const d = await resBookings.json();
        setBookings(d.bookings || []);
      }
      if (resRooms.ok) {
        const d = await resRooms.json();
        setRooms(d.rooms || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo, roomId]);

  if (user && user.role !== "Admin" && user.role !== "Approver" && user.role !== "Inspector" && user.role !== "Endorser") {
    return (
      <AppShell>
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงรายงาน</h2>
          <p className="text-xs text-slate-500 mt-1">
            รายงานเชิงวิเคราะห์สงวนไว้สำหรับ Admin และ Approver เท่านั้น
          </p>
        </div>
      </AppShell>
    );
  }

  const handleExportCsv = () => {
    exportBookingsToCsv(bookings, `meeting_bookings_${Date.now()}.csv`);
  };

  const handleExportExcel = () => {
    exportBookingsToExcel(bookings, `meeting_bookings_${Date.now()}.xlsx`);
  };

  const handleExportPdf = () => {
    exportBookingsToPdf(bookings, "รายงานสถิติและการจองห้องประชุม");
  };

  const summary = reportData?.summary || {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    cancelled: 0,
    approvalRate: 0,
  };

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">รายงานและสถิติการใช้งาน</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            วิเคราะห์อัตราการใช้ห้อง อัตราการอนุมัติ และส่งออกข้อมูลเป็น CSV, Excel, PDF
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>ช่วงวันที่:</span>
        </span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
        />
        <span className="text-slate-400">ถึง</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
        />

        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50"
        >
          <option value="all">ทุกห้องประชุม</option>
          {rooms.map((r) => (
            <option key={r.roomId} value={r.roomId}>
              {r.name}
            </option>
          ))}
        </select>

        {(dateFrom || dateTo || roomId !== "all") && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setRoomId("all");
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold ml-auto"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="คำขอจองทั้งหมด"
          value={summary.total}
          subtitle={`อัตราการอนุมัติ ${summary.approvalRate}%`}
          icon={BarChart3}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="อนุมัติแล้ว (Approved)"
          value={summary.approved}
          subtitle="คำขอที่ได้รับการยืนยัน"
          icon={CheckCircle2}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="ปฏิเสธ (Rejected)"
          value={summary.rejected}
          subtitle="คำขอที่ไม่ผ่านการอนุมัติ"
          icon={XCircle}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
        <StatCard
          title="รอพิจารณา (Pending)"
          value={summary.pending}
          subtitle="คำขอที่รอการตรวจสอบ"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Formulas & Metric Calculation Explanations */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1.5">
        <p className="font-bold flex items-center gap-1.5 text-blue-950">
          <span>📐 สูตรการคำนวณตัวชี้วัดในระบบ (Metric Formulas):</span>
        </p>
        <p>
          • <strong>อัตราการอนุมัติ (Approval Rate)</strong> = <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">(จำนวนที่อนุมัติ ÷ จำนวนคำขอทั้งหมด) × 100</code>
        </p>
        <p>
          • <strong>อัตราการใช้ห้อง (Room Utilization Rate)</strong> = <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">(ชั่วโมงการประชุมที่อนุมัติจริง ÷ ชั่วโมงที่เปิดให้บริการทั้งหมด 8 ชม./วัน) × 100</code>
        </p>
      </div>

      {/* Charts Section */}
      {loading ? (
        <LoadingSpinner message="กำลังคำนวณสถิติและสร้างกราฟ..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              แนวโน้มคำขอและการอนุมัติ
            </h3>
            <p className="text-xs text-slate-400 mb-4">จำนวนการจองในแต่ละวัน</p>
            <BookingTrendsChart data={reportData?.dailyTrends || []} />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              สถิติการใช้งานแยกตามห้องประชุม
            </h3>
            <p className="text-xs text-slate-400 mb-4">เปรียบเทียบความนิยมและจำนวนครั้งที่ใช้</p>
            <RoomUtilizationChart data={reportData?.roomStats || []} />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              จัดอันดับแผนกวิชา/หน่วยงานที่ขอใช้บริการสูงสุด
            </h3>
            <p className="text-xs text-slate-400 mb-4">แสดงเป็นกราฟแท่งแนวนอน เรียงลำดับจากมากไปน้อย</p>
            <DepartmentRankingChart data={reportData?.departmentStats || []} />
          </div>
        </div>
      )}

      {/* Department Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            สัดส่วนการจองแยกตามหน่วยงาน / แผนก
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">หน่วยงาน / ฝ่าย</th>
                <th className="py-3 px-4">จำนวนครั้งที่ขอจอง</th>
                <th className="py-3 px-6 text-right">สัดส่วน (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportData?.departmentStats?.map((dept: any, i: number) => {
                const pct = summary.total > 0 ? Math.round((dept.count / summary.total) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-semibold text-slate-800">{dept.department}</td>
                    <td className="py-3 px-4">{dept.count} ครั้ง</td>
                    <td className="py-3 px-6 text-right font-medium text-slate-900">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
