"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { FilterChips } from "./filter-chips";
import { dashboardHref, spendingsHref } from "@/lib/admin-period-href";
import type { DashboardPeriodKind, ResolvedPeriod } from "./types";
import { cn } from "@/lib/utils";

const CHIP_OPTIONS = ["Today", "Week", "Month"] as const;

const CHIP_TO_KIND: Record<(typeof CHIP_OPTIONS)[number], DashboardPeriodKind> =
  {
    Today: "today",
    Week: "week",
    Month: "month",
  };

const KIND_TO_CHIP: Record<"today" | "week" | "month", string> = {
  today: "Today",
  week: "Week",
  month: "Month",
};

type PeriodControlProps = {
  period: ResolvedPeriod;
  /** Base path to navigate (`dashboard` or `spendings`). */
  base: "dashboard" | "spendings";
  className?: string;
};

function hrefFor(
  base: "dashboard" | "spendings",
  kind: DashboardPeriodKind,
  date?: string,
) {
  return base === "spendings"
    ? spendingsHref(kind, date)
    : dashboardHref(kind, date);
}

/** Today / Week / Month chips plus a native date picker for a single day. */
export function PeriodControl({ period, base, className }: PeriodControlProps) {
  const router = useRouter();
  const activeChip =
    period.kind === "date" ? "" : KIND_TO_CHIP[period.kind] ?? "Today";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <FilterChips
        options={[...CHIP_OPTIONS]}
        active={activeChip}
        onChange={(label) => {
          const kind = CHIP_TO_KIND[label as (typeof CHIP_OPTIONS)[number]];
          router.push(hrefFor(base, kind));
        }}
        className="min-w-0 flex-1 overflow-x-auto"
      />
      <label
        className={cn(
          "relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
          period.kind === "date"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-foreground hover:bg-accent/80",
        )}
        title="Pick a day"
      >
        <CalendarDays className="size-4" />
        <input
          type="date"
          aria-label="Pick a day"
          value={period.kind === "date" ? period.startDate : ""}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) return;
            router.push(hrefFor(base, "date", value));
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
