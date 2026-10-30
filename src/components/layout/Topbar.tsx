"use client";

import React from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { UserRole } from "@/lib/data/types";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import { Radio, ShieldCheck, UserCheck, User } from "lucide-react";

interface TopbarProps {
  onOpenBookingModal?: (bookingId: string) => void;
  isRealtimeConnected?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenBookingModal,
  isRealtimeConnected = true,
}) => {
  const { user, switchUserRoleDemo } = useAuth();

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string; icon: any }> = {
    Admin: {
      label: "ผู้ดูแลระบบ (Admin)",
      bg: "bg-purple-100",
      text: "text-purple-800",
      icon: ShieldCheck,
    },
    Approver: {
      label: "ผู้อนุมัติ (Approver)",
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      icon: UserCheck,
    },
    User: {
      label: "ผู้ใช้งานทั่วไป (User)",
      bg: "bg-blue-100",
      text: "text-blue-800",
      icon: User,
    },
  };

  const currentRole = user?.role || "User";
  const roleConfig = roleBadges[currentRole];
  const RoleIcon = roleConfig.icon;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-800 hidden sm:block">
          ระบบจองห้องประชุมออนไลน์
        </h2>

        {/* Real-time SSE indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
            isRealtimeConnected
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-slate-100 text-slate-500 border border-slate-200"
          }`}
          title={isRealtimeConnected ? "เชื่อมต่อ Real-time SSE พร้อมใช้งาน" : "กำลังเชื่อมต่อ Real-time..."}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isRealtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span className="hidden md:inline font-medium">
            {isRealtimeConnected ? "Live Real-time" : "Connecting..."}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Demo Role Switcher for Instant Evaluation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <span className="text-[11px] text-slate-500 px-2 font-medium hidden lg:inline">
            สลับสิทธิ์ทดสอบ:
          </span>
          {(["Admin", "Approver", "User"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchUserRoleDemo(r)}
              className={`px-2 py-1 rounded font-medium transition-all ${
                currentRole === r
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Notification Bell */}
        <NotificationDropdown onSelectBooking={onOpenBookingModal} />

        {/* Current User Badge */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${roleConfig.bg} ${roleConfig.text}`}
            >
              <RoleIcon className="w-3 h-3" />
              {roleConfig.label}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
