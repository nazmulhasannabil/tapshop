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

export type DayValue = {
  day: string;
  value: number;
};

type AdminChartProps = {
  data: DayValue[];
};

/** Highlight color index for Friday (index 4 in a Mon–Sun dataset). */
const FRIDAY_INDEX = 4;
const BAR_FILL = "var(--color-primary, #4f46e5)";
const BAR_HIGHLIGHT = "var(--color-primary, #4f46e5)";

/** Weekly consumption-trend bar chart with rounded bars. */
export function AdminChart({ data }: AdminChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={28}>
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
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
          formatter={(value: unknown) => [`৳${value}k`, "Spend"]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === FRIDAY_INDEX ? BAR_HIGHLIGHT : BAR_FILL}
              opacity={index === FRIDAY_INDEX ? 1 : 0.55}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
