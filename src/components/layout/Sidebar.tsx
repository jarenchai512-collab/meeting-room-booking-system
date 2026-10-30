"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  CheckSquare2,
  DoorOpen,
  BarChart3,
  Settings,
  ShieldAlert,
  LogOut,
  Building2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard ภาพรวม",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["Admin", "Approver", "Inspector", "Endorser", "User"],
    },
    {
      name: "ปฏิทินห้องประชุม",
      href: "/calendar",
      icon: CalendarDays,
      roles: ["Admin", "Approver", "Inspector", "Endorser", "User"],
    },
    {
      name: "รายการคำขอจอง",
      href: "/bookings",
      icon: CalendarCheck2,
      roles: ["Admin", "Approver", "Inspector", "Endorser", "User"],
    },
    {
      name: "พิจารณาอนุมัติ 3 ระดับ",
      href: "/approvals",
      icon: CheckSquare2,
      roles: ["Admin", "Approver", "Inspector", "Endorser"],
      badge: "Pending",
    },
    {
      name: "ข้อมูล 6 ห้องประชุม",
      href: "/rooms",
      icon: DoorOpen,
      roles: ["Admin", "Approver", "Inspector", "Endorser", "User"],
    },
    {
      name: "รายงานและส่งออก (Export)",
      href: "/reports",
      icon: BarChart3,
      roles: ["Admin", "Approver", "Inspector", "Endorser"],
    },
    {
      name: "ประวัติการใช้งาน (Audit)",
      href: "/audit-logs",
      icon: ShieldAlert,
      roles: ["Admin"],
    },
    {
      name: "ตั้งค่าระบบ & Webhook",
      href: "/settings",
      icon: Settings,
      roles: ["Admin"],
    },
  ];

  const filteredNav = navigation.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div className="truncate">
          <h1 className="font-bold text-white text-xs tracking-wide truncate">
            วท.ท่าหลวงซิเมนต์ไทยฯ
          </h1>
          <p className="text-[10px] text-blue-300 truncate">ระบบจองห้องประชุมออนไลน์</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          เมนูหลัก
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="min-w-0 pr-2">
          <p className="text-xs font-semibold text-white truncate">
            {user?.name || "ผู้ใช้งาน"}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {user?.role === "Inspector"
              ? "ผู้ตรวจห้อง"
              : user?.role === "Endorser"
              ? "ผู้รับรอง"
              : user?.role === "Approver"
              ? "ผู้อนุมัติ"
              : user?.role === "Admin"
              ? "ผู้ดูแลระบบ"
              : "บุคลากร"}
          </p>
        </div>
        <button
          onClick={logout}
          title="ออกจากระบบ"
          className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
