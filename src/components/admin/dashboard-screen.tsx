"use client";

import {
  MoreHorizontal,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { AdminChart } from "./admin-chart";
import { ActivityCard } from "./admin-activity-card";
import { StatCard } from "./stat-card";
import type { AdminStats, RecentActivity, WeeklyData } from "./types";

type DashboardScreenProps = {
  stats: AdminStats;
  weekly: WeeklyData;
  activity: RecentActivity[];
};

/** Admin analytics dashboard — summary cards, chart, and recent activity. */
export function DashboardScreen({
  stats,
  weekly,
  activity,
}: DashboardScreenProps) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
      {/* Intro */}
      <div className="space-y-1 pb-5 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Overview of your shop analytics and recent activity.
        </p>
      </div>

      <main className="space-y-3">
        {/* Summary cards — 2x2 grid */}
        <section className="grid grid-cols-2 gap-3">
          {/* Total Users */}
          <StatCard
            href="/users"
            icon={<Users className="size-4" />}
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            badge={
              <Badge className="bg-success/15 text-success border-0 text-[10px] font-semibold px-1.5 py-0.5">
                {stats.totalUsersGrowth}
              </Badge>
            }
          />

              {/* Today's Spend */}
              <StatCard
                href="/dashboard/today"
                icon={<ShoppingBag className="size-4" />}
                label="Today's Spend"
                value={formatCurrency(stats.todaySpend)}
                variant="primary"
              />

              {/* Month Revenue */}
              <StatCard
                href="/dashboard/month"
                icon={<TrendingUp className="size-4" />}
                label="Month Revenue"
                value={formatCurrency(stats.monthSpend)}
              />

              {/* Active Today — full-width indigo card */}
              <div className="col-span-2">
            <StatCard
              href="/dashboard/active"
              icon={<Zap className="size-4" />}
              label="Active Today"
              value={String(stats.activeToday)}
              variant="primary"
            />
          </div>
        </section>

        {/* Consumption Trend */}
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Consumption Trend
              </h2>
              <p className="text-xs text-muted-foreground">
                30-day trailing view
              </p>
            </div>
            <button
              type="button"
              aria-label="More options"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </div>
          <div className="mt-2">
            <AdminChart data={weekly} />
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-2xl bg-card px-4 pb-1 pt-4 ring-1 ring-border shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Recent Activity
            </h2>
            <Link
              href="/activity"
              className="text-xs font-semibold text-primary hover:underline"
            >
              VIEW ALL
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {activity.map((item) => (
              <ActivityCard key={item.id} {...item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
