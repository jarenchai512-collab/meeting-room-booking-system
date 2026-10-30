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

interface DepartmentRankingChartProps {
  data: { department: string; count: number }[];
}

const DEPT_COLORS = [
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#059669",
  "#0891B2",
  "#D97706",
  "#E11D48",
  "#64748B",
];

export const DepartmentRankingChart: React.FC<DepartmentRankingChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        ยังไม่มีสถิติคำขอแยกตามแผนกวิชา
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    shortName: d.department.replace("แผนกวิชา", "").trim(),
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
            width={110}
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
            formatter={(value: any) => [`${value} คำขอ`, "จำนวนการขอใช้บริการ"]}
            labelFormatter={(label) => `แผนกวิชา${label}`}
          />
          <Bar dataKey="count" name="จำนวนคำขอใช้ห้อง" radius={[0, 6, 6, 0]}>
            {formatted.map((entry, index) => (
              <Cell
                key={`dept-${index}`}
                fill={DEPT_COLORS[index % DEPT_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
