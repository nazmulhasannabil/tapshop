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
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Your Stats
      </h1>

      <section className="grid grid-cols-3 gap-2">
        <SoftTile
          icon={<Wallet className="size-4" />}
          tone="primary"
          label="Today"
          value={formatCurrency(stats.todaySpend)}
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

      <section className="rounded-2xl bg-card p-5">
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
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "primary" | "info" | "success";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "info"
        ? "bg-info/10 text-info"
        : "bg-success/10 text-success";

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-card px-2.5 py-2">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${toneClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-bold tracking-tight tnum text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
