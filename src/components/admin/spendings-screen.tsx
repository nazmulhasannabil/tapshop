"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Hash, ShoppingBag, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import { PeriodControl } from "./period-control";
import type {
  PeriodSummary,
  PeriodUserSpend,
  ResolvedPeriod,
} from "./types";

type SpendingsScreenProps = {
  period: ResolvedPeriod;
  summary: PeriodSummary;
  spenders: PeriodUserSpend[];
};

/** Full period spendings list — who spent how much in the selected range. */
export function SpendingsScreen({
  period,
  summary,
  spenders,
}: SpendingsScreenProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-24">
      <div className="flex items-center gap-3 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Spendings</h1>
      </div>

      <PeriodControl period={period} base="spendings" className="pb-3" />

      <main className="space-y-3">
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              {period.label}
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tnum">
            {formatCurrency(summary.totalSpend)}
          </p>
          <p className="mt-1 text-sm text-primary-foreground/80">
            {summary.activeUsers} active user
            {summary.activeUsers !== 1 ? "s" : ""}
          </p>
        </section>

        {spenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-16 ring-1 ring-border">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No spend in this period
            </p>
          </div>
        ) : (
          <section className="rounded-2xl bg-card px-4 pb-2 pt-4 ring-1 ring-border shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              By person
            </h2>
            <div className="mt-2 divide-y divide-border/60">
              {spenders.map((user) => (
                <SpenderRow key={user.id} user={user} />
              ))}
            </div>
          </section>
        )}
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
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-accent">
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
          {user.lastActivityAt && (
            <>
              <span className="text-border">·</span>
              <span className="text-[11px] text-muted-foreground">
                {formatRelativeTime(user.lastActivityAt)}
              </span>
            </>
          )}
        </div>
      </div>
      <p className="text-sm font-semibold tnum text-foreground">
        {formatCurrency(user.totalSpend)}
      </p>
    </Link>
  );
}
