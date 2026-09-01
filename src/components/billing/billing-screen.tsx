"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrateBillStore } from "@/hooks/use-hydrate-bill-store";
import { useBillTotals } from "@/stores/bill-store";
import { DEFAULT_DAILY_TARGET } from "@/lib/constants";
import { useSpendMilestone } from "@/hooks/use-spend-milestone";
import type { BillLine, CatalogItem } from "@/types/bill";

import { AddItemSheet } from "./add-item-sheet";
import { AnimatedTotal } from "./animated-total";
import { BillSheet } from "./bill-sheet";
import { BillSummary } from "./bill-summary";
import { ItemGrid } from "./item-grid";
import { RecentTaps } from "./recent-taps";

export function BillingScreen({
  items,
  todayBill,
  recent,
}: {
  items: CatalogItem[];
  todayBill: BillLine[];
  recent: CatalogItem[];
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(items);
  const [recentItems, setRecentItems] = useState<CatalogItem[]>(recent);

  const [billOpen, setBillOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { count, total } = useBillTotals();

  // Toast when today's bill crosses each 100৳ milestone (100/200/300…).
  useSpendMilestone(total);

  useHydrateBillStore(todayBill);

  // Move a just-tapped / just-created item to the front of Recently Used.
  function bumpRecent(item: CatalogItem) {
    setRecentItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
  }

  function handleCreate(item: CatalogItem) {
    setCatalog((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    bumpRecent(item);
  }

  const progressPct = Math.min(100, Math.round((total / DEFAULT_DAILY_TARGET) * 100));

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <main className="flex-1 space-y-7 px-4 pb-44 pt-6">
        {/* Today's bill card */}
        <section
          aria-label="Today's bill"
          className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today&apos;s Bill
            </p>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>
          <AnimatedTotal
            value={total}
            className="mt-0.5 block text-3xl font-bold tracking-tight text-foreground"
          />
          {/* Progress toward the daily spending target */}
          <div
            className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-accent"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label={`Spent ${progressPct}% of daily target`}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>

        {/* Recent taps */}
        {recentItems.length > 0 && (
          <Section title="Recent Taps">
            <RecentTaps items={recentItems} onItemTap={bumpRecent} />
          </Section>
        )}

        {/* All items (catalog) */}
        <Section
          title="All Items"
          action={
            <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add
            </Button>
          }
        >
          <ItemGrid items={catalog} onItemTap={bumpRecent} />
        </Section>
      </main>

      <BillSummary onOpen={() => setBillOpen(true)} />

      <BillSheet open={billOpen} onOpenChange={setBillOpen} />
      <AddItemSheet open={addOpen} onOpenChange={setAddOpen} onCreate={handleCreate} />
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Server-rendered placeholder shown while the page loads its data. */
export function BillingScreenSkeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pt-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
