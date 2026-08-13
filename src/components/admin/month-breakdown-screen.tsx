"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Hash, BarChart3 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import type { MonthUserSpend } from "./types";

type MonthBreakdownScreenProps = {
  total: number;
  users: MonthUserSpend[];
};

/** Month Revenue drill-down — per-user breakdown with amount and percentage. */
export function MonthBreakdownScreen({
  total,
  users,
}: MonthBreakdownScreenProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-24">
      {/* Back navigation */}
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Month Revenue</h1>
      </div>

      <main className="space-y-3">
        {/* Summary card */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
              <TrendingUp className="size-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              This Month Total
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tnum">
            {formatCurrency(total)}
          </p>
        </section>

        {/* User list */}
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-16 ring-1 ring-border">
            <BarChart3 className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No revenue recorded this month
            </p>
          </div>
        ) : (
          <section className="rounded-2xl bg-card px-4 pb-2 pt-4 ring-1 ring-border shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              Revenue by User
            </h2>
            <div className="mt-2 divide-y divide-border/60">
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function UserRow({ user }: { user: MonthUserSpend }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3">
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
          {/* Percentage bar */}
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-all"
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
        {formatCurrency(user.totalMonth)}
      </p>
    </div>
  );
}
