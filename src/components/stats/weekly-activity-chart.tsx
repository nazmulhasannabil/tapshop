"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/constants";
import type { DayTotal } from "@/lib/services/stats";

const CHART_HEIGHT = 200;

/**
 * Minimal Mon–Sun spending bar chart for the Stats screen.
 *
 * Rendered only after mount (with a same-sized skeleton placeholder) so the
 * ResponsiveContainer never measures during SSR — that avoids hydration
 * mismatches and the well-known recharts width=0-on-first-paint flash.
 */
export function WeeklyActivityChart({ data }: { data: DayTotal[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart
        data={data}
        margin={{ top: 12, right: 4, bottom: 0, left: 4 }}
        barCategoryGap="22%"
      >
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          dy={10}
        />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          cursor={false}
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--foreground)",
            fontSize: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
        />
        <Bar
          dataKey="value"
          radius={[8, 8, 0, 0]}
          fill="var(--primary)"
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
