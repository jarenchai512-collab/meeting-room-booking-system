"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingSpinner, EmptyState } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth/auth-context";
import { AuditLog } from "@/lib/data/types";
import { ShieldAlert, Clock, RefreshCw } from "lucide-react";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit-logs?limit=150");
      if (res.ok) {
        const d = await res.json();
        setLogs(d.logs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (user && user.role !== "Admin") {
    return (
      <AppShell>
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึง Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกประวัติการดำเนินการสงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ประวัติการดำเนินการ (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกการกระทำของผู้ใช้ การสร้าง แก้ไข อนุมัติ ปฏิเสธ และเข้าสู่ระบบ
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรชประวัติ</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="กำลังโหลด Audit Logs..." />
        ) : logs.length === 0 ? (
          <EmptyState title="ยังไม่มีบันทึก Audit Logs" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">วันเวลา</th>
                  <th className="py-3 px-4">ผู้ดำเนินการ</th>
                  <th className="py-3 px-4">การกระทำ (Action)</th>
                  <th className="py-3 px-4">ประเภทข้อมูล</th>
                  <th className="py-3 px-6">รายละเอียด</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("th-TH")}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      <div>{log.userName}</div>
                      <span className="text-[10px] text-slate-400">({log.userRole})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">{log.entityType}</td>
                    <td className="py-3 px-6 font-sans text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details || "-"}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
