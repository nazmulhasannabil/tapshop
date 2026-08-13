"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import type { ActiveTodayUser } from "./types";

type ActiveTodayScreenProps = {
  users: ActiveTodayUser[];
};

/** Active Today drill-down — list of all users who have activity today. */
export function ActiveTodayScreen({
  users,
}: ActiveTodayScreenProps) {
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
        <h1 className="text-lg font-bold text-foreground">Active Today</h1>
      </div>

      <main className="space-y-3">
        {/* Summary card */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
              <Zap className="size-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              Active Users
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tnum">
            {users.length}
          </p>
        </section>

        {/* User list */}
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-16 ring-1 ring-border">
            <Zap className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No active users today
            </p>
          </div>
        ) : (
          <section className="rounded-2xl bg-card px-4 pb-2 pt-4 ring-1 ring-border shadow-sm">
            <h2 className="text-base font-bold text-foreground">
              Today&apos;s Active Users
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

function UserRow({ user }: { user: ActiveTodayUser }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="relative">
        <Avatar className="size-10">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback className="bg-accent text-xs font-semibold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* Green active dot */}
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {user.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{user.email}</span>
          <span className="text-border">·</span>
          <Clock className="size-3 shrink-0" />
          <span className="shrink-0">
            {formatRelativeTime(user.lastActiveAt)}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold tnum text-foreground">
        {formatCurrency(user.todaySpend)}
      </p>
    </div>
  );
}
