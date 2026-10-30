"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err: any) {
      setError(err?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (u: string, p: string = "123456") => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          ระบบจองห้องประชุมออนไลน์
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200/80">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกชื่อผู้ใช้..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="กรอกรหัสผ่าน..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <span>{submitting ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons for the 3 Officials & Users */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-600 text-center mb-2.5">
              คลิกเพื่อทดสอบเข้าใช้งานด้วยตำแหน่งต่างๆ:
            </p>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill("watcharapong")}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <span className="font-semibold">นายวัชรพงศ์ โสภา (ผู้ตรวจห้อง)</span>
                </div>
                <span className="text-[10px] text-slate-400">watcharapong</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("ekarat")}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                  <span className="font-semibold">นายเอกราช เขียวทอง (ผู้รับรอง)</span>
                </div>
                <span className="text-[10px] text-slate-400">ekarat</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("chatree")}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
                  <span className="font-semibold">นายชาตรี เริงชัยภูมิ (รอง ผอ. อนุมัติ)</span>
                </div>
                <span className="text-[10px] text-slate-400">chatree</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickFill("somchai")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>ครูสมชาย (ผู้ขอจอง)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin สูงสุด</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              * รหัสผ่านเริ่มต้นคือ: <code>123456</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
