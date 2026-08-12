import {
  BarChart3,
  CalendarDays,
  Coffee,
  MoreHorizontal,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { formatCurrency } from "@/lib/constants";
import type { StatsData } from "@/lib/services/stats";
import { WeeklyActivityChart } from "./weekly-activity-chart";

/**
 * The mobile "Stats" dashboard. Renders spending summaries sourced from
 * `bill_entries` plus a weekly activity chart. Pure presentational — the only
 * client island is {@link WeeklyActivityChart}.
 */
export function StatsScreen({ stats }: { stats: StatsData }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
      {/* Intro */}
      <div className="space-y-1 pb-5 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Your Stats
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Track your spending habits and keep your finances in check.
        </p>
      </div>

      <main className="space-y-3">
        {/* Today's spend — the hero card */}
        <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
              <Wallet className="size-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              Today&apos;s Spend
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight tnum">
            {formatCurrency(stats.todaySpend)}
          </p>
          <p className="mt-1.5 text-sm text-primary-foreground/80">
            {todayTrend(stats.todaySpend, stats.yesterdaySpend)}
          </p>
        </section>

        {/* This week / This month */}
        <section className="grid grid-cols-2 gap-3">
          <SoftTile
            icon={<BarChart3 className="size-5" />}
            tone="info"
            label="This Week"
            value={formatCurrency(stats.weekSpend)}
          />
          <SoftTile
            icon={<CalendarDays className="size-5" />}
            tone="success"
            label="This Month"
            value={formatCurrency(stats.monthSpend)}
          />
        </section>

        {/* Items / Most used */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShoppingBag className="size-5" />
            </span>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Items
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight tnum text-foreground">
                {stats.itemsTapped}
              </span>
              <span className="text-xs text-muted-foreground">taps</span>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-full bg-warning/15 text-warning">
              <Coffee className="size-5" />
            </span>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Most Used
            </p>
            {stats.mostUsed ? (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-sm font-medium text-foreground">
                <span className="text-base leading-none">
                  {stats.mostUsed.icon ?? "🏷️"}
                </span>
                {stats.mostUsed.name}
              </span>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Nothing yet</p>
            )}
          </div>
        </section>

        {/* Weekly activity */}
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Weekly Activity
            </h2>
            <button
              type="button"
              aria-label="More options"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </div>
          <div className="mt-1">
            <WeeklyActivityChart data={stats.weekly} />
          </div>
        </section>
      </main>
    </div>
  );
}

/** Soft lavender stat tile (This Week / This Month). */
function SoftTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "info" | "success";
}) {
  const toneClass =
    tone === "info"
      ? "bg-info/10 text-info"
      : "bg-success/10 text-success";

  return (
    <div className="rounded-2xl bg-accent p-4 ring-1 ring-border/60">
      <span
        className={`flex size-9 items-center justify-center rounded-full ${toneClass}`}
      >
        {icon}
      </span>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight tnum text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Today-vs-yesterday trend line, e.g. "↘ 12% from yesterday".
 * Handles the yesterday-was-zero edge case gracefully.
 */
function todayTrend(today: number, yesterday: number): string {
  if (yesterday <= 0) {
    return today > 0 ? "↗ New today" : "No spend yet";
  }
  const pct = Math.round((Math.abs(today - yesterday) / yesterday) * 100);
  return `${today < yesterday ? "↘" : "↗"} ${pct}% from yesterday`;
}
