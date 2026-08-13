"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  Pencil,
  ShieldBan,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/constants";
import type { AdminUser, AdminTransaction } from "./types";

type UserDetailsScreenProps = {
  user: AdminUser;
  transactions: AdminTransaction[];
};

/** Detailed view for a single user — profile, spending, and transaction history. */
export function UserDetailsScreen({
  user,
  transactions,
}: UserDetailsScreenProps) {
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
        <h1 className="text-lg font-bold text-foreground">User Details</h1>
      </div>

      <main className="space-y-3">
        {/* Profile card */}
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="size-16">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="bg-accent text-lg font-semibold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {user.status === "active" && (
                <span className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-card bg-success" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge
                variant="secondary"
                className="mt-1.5 gap-1 text-[10px] font-medium"
              >
                <CalendarPlus className="size-3" />
                Joined {user.joinedDate}
              </Badge>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 h-px bg-border/60" />

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 gap-2" size="default">
              <Pencil className="size-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              size="default"
            >
              <ShieldBan className="size-4" />
              Restrict
            </Button>
          </div>
        </section>

        {/* Total Spent — indigo card */}
        <section className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/15">
              <Wallet className="size-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/80">
              Total Spent
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight tnum">
            {formatCurrency(user.totalSpent)}
          </p>
        </section>

        {/* Spending summary — two small cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Avg/Tap
            </p>
            <p className="mt-1 text-xl font-bold tnum text-foreground">
              {formatCurrency(user.avgPerTap)}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              This Month
            </p>
            <p className="mt-1 text-xl font-bold tnum text-foreground">
              {formatCurrency(user.thisMonth)}
            </p>
          </div>
        </section>

        {/* Spending History */}
        <section className="rounded-2xl bg-card px-4 pb-2 pt-4 ring-1 ring-border shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Spending History
            </h2>
            <Link
              href="/users"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="mt-2 divide-y divide-border/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-lg">
                  {tx.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {tx.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tnum text-foreground">
                    {formatCurrency(tx.amount)}
                  </p>
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-medium px-1.5 py-0"
                  >
                    Qty: {tx.quantity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
