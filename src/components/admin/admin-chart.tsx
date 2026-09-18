"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { formatCurrency } from "@/lib/constants";

export type DayValue = {
  day: string;
  value: number;
};

type AdminChartProps = {
  data: DayValue[];
};

const BAR_FILL = "var(--color-primary, #4f46e5)";

/** Period spend bar chart — adapts bar width for week vs month series. */
export function AdminChart({ data }: AdminChartProps) {
  const maxValue = Math.max(0, ...data.map((d) => d.value));
  const barSize = data.length > 14 ? 8 : data.length > 7 ? 14 : 28;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={barSize}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          interval={data.length > 14 ? 2 : 0}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground, #71717a)" }}
          dy={8}
        />
        <YAxis hide />
        <Tooltip
          cursor={false}
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,.1)",
            fontSize: "12px",
          }}
          formatter={(value: unknown) => [
            formatCurrency(Number(value ?? 0)),
            "Spend",
          ]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={BAR_FILL}
              opacity={entry.value === maxValue && maxValue > 0 ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
