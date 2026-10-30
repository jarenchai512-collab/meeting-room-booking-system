"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BookingTrendsChartProps {
  data: { date: string; bookings: number; approved: number }[];
}

export const BookingTrendsChart: React.FC<BookingTrendsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        ไม่มีข้อมูลแนวโน้มการจอง
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    displayDate: d.date.substring(5), // MM-DD
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.75rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Area
            type="monotone"
            dataKey="bookings"
            name="คำขอทั้งหมด"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBookings)"
          />
          <Area
            type="monotone"
            dataKey="approved"
            name="อนุมัติแล้ว"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorApproved)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
