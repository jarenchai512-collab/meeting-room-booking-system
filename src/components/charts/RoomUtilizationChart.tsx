"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RoomUtilizationChartProps {
  data: { roomId: string; name: string; bookings: number; color?: string }[];
}

export const RoomUtilizationChart: React.FC<RoomUtilizationChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        ไม่มีข้อมูลการใช้งานห้อง
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    shortName: d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
          <YAxis
            type="category"
            dataKey="shortName"
            width={120}
            tick={{ fontSize: 11, fill: "#334155" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0.75rem",
              border: "1px solid #E2E8F0",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="bookings" name="จำนวนครั้งที่ใช้งาน" radius={[0, 6, 6, 0]}>
            {formatted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || "#3B82F6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
