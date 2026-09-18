"use client";

import Link from "next/link";
import { ShoppingBag, Zap, Hash, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/constants";
import { spendingsHref } from "@/lib/admin-period-href";
import { AdminChart } from "./admin-chart";
import { PeriodControl } from "./period-control";
import { StatCard } from "./stat-card";
import type {
  DailyPoint,
  PeriodSummary,
  PeriodUserSpend,
  ResolvedPeriod,
} from "./types";

type DashboardScreenProps = {
  period: ResolvedPeriod;
  summary: PeriodSummary;
  daily: DailyPoint[];
  spenders: PeriodUserSpend[];
  hasMoreSpenders: boolean;
};

/** Admin pulse — period spend, trend, and everyone who spent. */
export function DashboardScreen({
  period,
  summary,
  daily,
  spenders,
  hasMoreSpenders,
}: DashboardScreenProps) {
  const spendingsLink =
    period.kind === "date"
      ? spendingsHref("date", period.startDate)
      : spendingsHref(period.kind);

  const chartSubtitle =
    period.kind === "week"
      ? "Mon–Sun this week"
      : period.kind === "month"
        ? "Days this month"
        : null;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
      <div className="space-y-1 pb-4 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Spend by person and by day.
        </p>
      </div>

      <PeriodControl period={period} base="dashboard" className="pb-3" />

      <main className="space-y-3">
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            href={spendingsLink}
            icon={<ShoppingBag className="size-5" />}
            label={period.label}
            value={formatCurrency(summary.totalSpend)}
            variant="primary"
          />
          <StatCard
            href={spendingsLink}
            icon={<Zap className="size-5" />}
            label="Active"
            value={String(summary.activeUsers)}
          />
        </section>

        {daily.length > 0 && chartSubtitle && (
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-sm">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Daily spend
              </h2>
              <p className="text-xs text-muted-foreground">{chartSubtitle}</p>
            </div>
            <div className="mt-2">
              <AdminChart data={daily} />
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-card px-4 pb-2 pt-4 ring-1 ring-border shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Everyone&apos;s spendings
            </h2>
            {(hasMoreSpenders || spenders.length > 0) && (
              <Link
                href={spendingsLink}
                className="text-xs font-semibold text-primary hover:underline"
              >
                SEE ALL
              </Link>
            )}
          </div>

          {spenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No spend in this period
              </p>
            </div>
          ) : (
            <div className="mt-1 divide-y divide-border/60">
              {spenders.map((user) => (
                <SpenderRow key={user.id} user={user} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SpenderRow({ user }: { user: PeriodUserSpend }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/users/${user.id}`}
      className="flex items-center gap-3 py-3 transition-colors hover:bg-accent/40"
    >
      <Avatar className="size-10">
        {user.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback className="bg-accent text-xs font-semibold text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(user.percentage, 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {user.percentage}%
          </span>
          <span className="text-border">·</span>
          <Hash className="size-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            {user.tapCount} tap{user.tapCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold tnum text-foreground">
        {formatCurrency(user.totalSpend)}
      </p>
    </Link>
  );
}
