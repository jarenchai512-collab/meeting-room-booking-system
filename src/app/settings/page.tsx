"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Swal } from "@/lib/utils/sweetalert";
import {
  Settings,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderLock,
  FileSpreadsheet,
  Key,
  ShieldCheck,
  Megaphone,
  Send,
  Save,
  Globe,
  UserCheck,
  Building,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [collegeName, setCollegeName] = useState("วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์");
  const [announcement, setAnnouncement] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [officerInspector, setOfficerInspector] = useState("นายวัชรพงศ์ โสภา");
  const [officerEndorser, setOfficerEndorser] = useState("นายเอกราช เขียวทอง");
  const [officerApprover, setOfficerApprover] = useState("นายชาตรี เริงชัยภูมิ");

  const [savingSettings, setSavingSettings] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const fetchSettingsAndHealth = async () => {
    try {
      setLoading(true);
      const [resHealth, resSettings] = await Promise.all([
        fetch("/api/system/health").catch(() => null),
        fetch("/api/settings").catch(() => null),
      ]);

      if (resHealth && resHealth.ok) {
        const d = await resHealth.json();
        setHealthData(d);
      }

      if (resSettings && resSettings.ok) {
        const settings: any[] = await resSettings.json();
        settings.forEach((s) => {
          if (s.settingKey === "COLLEGE_NAME") setCollegeName(s.settingValue);
          if (s.settingKey === "DIGITAL_CENTER_ANNOUNCEMENT") setAnnouncement(s.settingValue);
          if (s.settingKey === "WEBHOOK_URL") setWebhookUrl(s.settingValue);
          if (s.settingKey === "OFFICER_INSPECTOR") setOfficerInspector(s.settingValue);
          if (s.settingKey === "OFFICER_ENDORSER") setOfficerEndorser(s.settingValue);
          if (s.settingKey === "OFFICER_APPROVER") setOfficerApprover(s.settingValue);
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndHealth();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const items = [
        { key: "COLLEGE_NAME", value: collegeName },
        { key: "DIGITAL_CENTER_ANNOUNCEMENT", value: announcement },
        { key: "WEBHOOK_URL", value: webhookUrl },
        { key: "OFFICER_INSPECTOR", value: officerInspector },
        { key: "OFFICER_ENDORSER", value: officerEndorser },
        { key: "OFFICER_APPROVER", value: officerApprover },
      ];

      for (const item of items) {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }

      await Swal.success(
        "บันทึกการตั้งค่าเรียบร้อย",
        "ข้อมูลสถานศึกษา เจ้าหน้าที่ผู้รับผิดชอบ และ Webhook ได้รับการอัปเดตแล้ว"
      );
    } catch (err: any) {
      Swal.error("เกิดข้อผิดพลาดในการบันทึก", err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith("http")) {
      Swal.warning("กรุณาระบุ Webhook URL", "โปรดกรอก URL ปลายทางที่ขึ้นต้นด้วย http:// หรือ https://");
      return;
    }

    setTestingWebhook(true);
    try {
      const res = await fetch("/api/settings/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.success("ทดสอบส่ง Webhook สำเร็จ!", "ระบบส่งข้อความทดสอบไปยังปลายทางเรียบร้อยแล้ว");
      } else {
        await Swal.error("ส่ง Webhook ไม่สำเร็จ", data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err: any) {
      Swal.error("เกิดข้อผิดพลาด", err.message);
    } finally {
      setTestingWebhook(false);
    }
  };

  if (user && user.role !== "Admin") {
    return (
      <AppShell>
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldCheck className="w-12 h-12 text-purple-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
          <p className="text-xs text-slate-500 mt-1">
            การตั้งค่าระบบและ Webhook สงวนไว้สำหรับ Admin เท่านั้น
          </p>
        </div>
      </AppShell>
    );
  }

  const isGoogleSheetsActive = healthData?.database?.provider === "google_sheets";
  const isDriveConfigured = healthData?.googleDrive?.configured;

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            ตั้งค่าระบบ &amp; Real-time Webhook
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดรายชื่อเจ้าหน้าที่ผู้พิจารณา 3 ระดับ ประกาศศูนย์ดิจิทัลฯ และการแจ้งเตือน Webhook
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="กำลังโหลดการตั้งค่าระบบ..." />
      ) : (
        <div className="space-y-6">
          {/* Form Settings Card */}
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 text-xs"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                ข้อมูลสถานศึกษาและข้อความประกาศ
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อสถานศึกษา</label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. เจ้าหน้าที่ผู้ตรวจสอบห้อง (ระดับที่ 1)
                </label>
                <input
                  type="text"
                  value={officerInspector}
                  onChange={(e) => setOfficerInspector(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. หัวหน้างาน/ผู้รับรอง (ระดับที่ 2)
                </label>
                <input
                  type="text"
                  value={officerEndorser}
                  onChange={(e) => setOfficerEndorser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. ผู้พิจารณาอนุมัติ (ระดับที่ 3)
                </label>
                <input
                  type="text"
                  value={officerApprover}
                  onChange={(e) => setOfficerApprover(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Announcement */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-blue-600" />
                ข้อความประกาศประชาสัมพันธ์สถานะห้องประชุมจากงานศูนย์ดิจิทัลฯ (แสดงบนหน้าแดชบอร์ด)
              </label>
              <textarea
                rows={3}
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>

            {/* Webhook Configuration */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  ส่งข้อความผ่าน Webhook แบบเรียลไทม์ (Discord / LINE Notify / Slack / Custom)
                </label>
                <span className="text-[11px] text-slate-500">Real-time Dispatcher</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                เมื่อมีคำขอจองใหม่ การตรวจห้อง การรับรองคำขอ หรือการอนุมัติ/ปฏิเสธ ระบบจะยิงข้อความ JSON เข้า Webhook URL ทันที
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/... หรือ https://hooks.slack.com/..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>{testingWebhook ? "กำลังส่งทดสอบ..." : "ทดสอบส่ง Webhook"}</span>
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}</span>
              </button>
            </div>
          </form>

          {/* Connection Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Sheets Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Google Sheets API</h3>
                    <p className="text-xs text-slate-500">ฐานข้อมูลของระบบ</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isGoogleSheetsActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {isGoogleSheetsActive ? "เชื่อมต่อ Google Cloud สำเร็จ" : "Local Persistent Engine (Active)"}
                </span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {healthData?.database?.details || "ระบบพร้อมใช้งาน"}
              </p>
            </div>

            {/* Google Drive Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <FolderLock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Google Drive API</h3>
                    <p className="text-xs text-slate-500">พื้นที่จัดเก็บเอกสารแนบการประชุม</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isDriveConfigured
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {isDriveConfigured ? "เชื่อมต่อ Google Drive สำเร็จ" : "Local Uploads Fallback (Active)"}
                </span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                Folder ID: <code className="font-mono">{healthData?.googleDrive?.folderId}</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
