import React from "react";
import { BookingStatus } from "@/lib/data/types";

interface StatusBadgeProps {
  status: BookingStatus;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const configs: Record<
    BookingStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    Approved: {
      label: "อนุมัติแล้ว",
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    Pending: {
      label: "รออนุมัติ",
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    Inspected: {
      label: "ตรวจห้องแล้ว",
      bg: "bg-cyan-50 border-cyan-200",
      text: "text-cyan-700",
      dot: "bg-cyan-500",
    },
    Endorsed: {
      label: "รับรองแล้ว",
      bg: "bg-violet-50 border-violet-200",
      text: "text-violet-700",
      dot: "bg-violet-500",
    },
    Rejected: {
      label: "ปฏิเสธแล้ว",
      bg: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
    Cancelled: {
      label: "ยกเลิกแล้ว",
      bg: "bg-slate-100 border-slate-200",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
    Completed: {
      label: "เสร็จสิ้นแล้ว",
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
  };

  const config = configs[status] || configs.Pending;
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
