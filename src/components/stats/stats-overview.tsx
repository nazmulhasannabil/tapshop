"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, CalendarDays, Wallet } from "lucide-react";

import { formatCurrency } from "@/lib/constants";
import { useStatsData } from "@/stores/stats-store";
import { MonthlyActivityCalendar } from "./monthly-activity-calendar";
import { WeeklyActivityChart } from "./weekly-activity-chart";

/**
 * Spend summary + week/month chart. Lives at the top of the Activity page.
 */
export function StatsOverview() {
  const stats = useStatsData();
  const [activityView, setActivityView] = useState<"week" | "month">("week");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your Stats
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Track your spending habits and keep your finances in check.
        </p>
      </div>

      <section className="grid grid-cols-3 gap-2">
        <SoftTile
          icon={<Wallet className="size-4" />}
          tone="primary"
          label="Today"
          value={formatCurrency(stats.todaySpend)}
          hint={todayTrend(stats.todaySpend, stats.yesterdaySpend)}
        />
        <SoftTile
          icon={<BarChart3 className="size-4" />}
          tone="info"
          label="This Week"
          value={formatCurrency(stats.weekSpend)}
        />
        <SoftTile
          icon={<CalendarDays className="size-4" />}
          tone="success"
          label="This Month"
          value={formatCurrency(stats.monthSpend)}
        />
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {activityView === "week" ? "Weekly Activity" : "Monthly Activity"}
          </h2>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Weekly activity"
              aria-pressed={activityView === "week"}
              onClick={() => setActivityView("week")}
              className={`flex size-8 items-center justify-center rounded-full transition ${
                activityView === "week"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <BarChart3 className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Monthly activity"
              aria-pressed={activityView === "month"}
              onClick={() => setActivityView("month")}
              className={`flex size-8 items-center justify-center rounded-full transition ${
                activityView === "month"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-1">
          {activityView === "week" ? (
            <WeeklyActivityChart data={stats.weekly} />
          ) : (
            <MonthlyActivityCalendar data={stats.monthly} />
          )}
        </div>
      </section>
    </div>
  );
}

/** Compact stat tile for the three-up spend row. */
function SoftTile({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "primary" | "info" | "success";
  hint?: string;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "info"
        ? "bg-info/10 text-info"
        : "bg-success/10 text-success";

  return (
    <div className="rounded-2xl bg-accent p-3 ring-1 ring-border/60">
      <span
        className={`flex size-8 items-center justify-center rounded-full ${toneClass}`}
      >
        {icon}
      </span>
      <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold tracking-tight tnum text-foreground sm:text-lg">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] leading-tight text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Today-vs-yesterday trend line, e.g. "↘ 12% from yesterday". */
function todayTrend(today: number, yesterday: number): string {
  if (yesterday <= 0) {
    return today > 0 ? "↗ New today" : "No spend yet";
  }
  const pct = Math.round((Math.abs(today - yesterday) / yesterday) * 100);
  return `${today < yesterday ? "↘" : "↗"} ${pct}% from yesterday`;
}
