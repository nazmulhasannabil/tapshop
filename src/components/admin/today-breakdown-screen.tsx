"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, Clock, Hash } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import type { TodayUserSpend } from "./types";

type TodayBreakdownScreenProps = {
  total: number;
  users: TodayUserSpend[];
};

/** Today's Spend drill-down — per-user breakdown with amount and last tap time. */
export function TodayBreakdownScreen({
  total,
  users,
}: TodayBreakdownScreenProps) {
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
        <h1 className="text-lg font-bold text-foreground">Today&apos;s Spend</h1>
      </div>

      <main className="space-y-3">
        {/* Summary card */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              Total Today
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tnum">
            {formatCurrency(total)}
          </p>
        </section>

        {/* User list */}
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-16 ring-1 ring-border">
            <ShoppingBag className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No spending recorded today
            </p>
          </div>
        ) : (
          <section className="rounded-2xl bg-card px-4 pb-2 pt-4 ring-1 ring-border shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              User Breakdown
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

function UserRow({ user }: { user: TodayUserSpend }) {
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{formatRelativeTime(user.lastTapAt)}</span>
          <span className="text-border">·</span>
          <Hash className="size-3" />
          <span>{user.tapCount} tap{user.tapCount !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <p className="text-sm font-semibold tnum text-foreground">
        {formatCurrency(user.totalToday)}
      </p>
    </div>
  );
}
