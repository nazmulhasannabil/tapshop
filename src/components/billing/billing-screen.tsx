"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillStore, useBillTotals } from "@/stores/bill-store";
import type { BillLine, CatalogItem } from "@/types/bill";

import { AddItemSheet } from "./add-item-sheet";
import { AnimatedTotal } from "./animated-total";
import { BillSheet } from "./bill-sheet";
import { BillSummary } from "./bill-summary";
import { ItemGrid } from "./item-grid";
import { ItemRow } from "./item-row";

export function BillingScreen({
  userName,
  items,
  todayBill,
  recent,
  frequent,
}: {
  userName: string;
  items: CatalogItem[];
  todayBill: BillLine[];
  recent: CatalogItem[];
  frequent: CatalogItem[];
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(items);
  const [recentItems, setRecentItems] = useState<CatalogItem[]>(recent);
  const [frequentItems] = useState<CatalogItem[]>(frequent);

  const [billOpen, setBillOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const hydrate = useBillStore((s) => s.hydrate);
  const { count, total } = useBillTotals();

  // Hydrate the optimistic store with today's authoritative bill (once).
  useEffect(() => {
    hydrate(todayBill);
  }, [hydrate, todayBill]);

  // Move a just-tapped / just-created item to the front of Recently Used.
  function bumpRecent(item: CatalogItem) {
    setRecentItems((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
  }

  function handleCreate(item: CatalogItem) {
    setCatalog((prev) => [item, ...prev.filter((i) => i.id !== item.id)]);
    bumpRecent(item);
  }

  const firstName = userName.split(" ")[0] || userName;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      {/* Greeting + today's bill */}
      <header className="space-y-1 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Hey {firstName} 👋</p>
          <Link
            href="/profile"
            aria-label="Profile"
            className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground transition hover:bg-muted/70"
          >
            {firstName.charAt(0).toUpperCase()}
          </Link>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
          Today&apos;s Bill
        </p>
        <div className="flex items-end justify-between">
          <AnimatedTotal
            value={total}
            className="text-4xl font-bold tracking-tight text-foreground"
          />
          <span className="pb-1 text-sm text-muted-foreground">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
      </header>

      <main className="flex-1 space-y-7 px-4 pb-6">
        {recentItems.length > 0 && (
          <Section title="Recently Used">
            <ItemRow items={recentItems} onItemTap={bumpRecent} />
          </Section>
        )}

        {frequentItems.length > 0 && (
          <Section title="Your Go-To's">
            <ItemRow items={frequentItems} onItemTap={bumpRecent} />
          </Section>
        )}

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
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
      <Skeleton className="mt-3 h-10 w-40" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
