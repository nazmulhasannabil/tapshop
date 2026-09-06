"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { FilterChips } from "@/components/admin/filter-chips";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrateBillStore } from "@/hooks/use-hydrate-bill-store";
import { useBillTotals } from "@/stores/bill-store";
import { DEFAULT_DAILY_TARGET } from "@/lib/constants";
import type { ItemCategory } from "@/lib/item-categories";
import { useSpendMilestone } from "@/hooks/use-spend-milestone";
import type { BillLine, CatalogItem } from "@/types/bill";

import { AddItemSheet } from "./add-item-sheet";
import { BillSheet } from "./bill-sheet";
import { HomeBillHeader } from "./home-bill-header";
import { ItemGrid } from "./item-grid";
import { RecentTaps } from "./recent-taps";

export function BillingScreen({
  items,
  todayBill,
  recent,
  categories: initialCategories,
  isAdmin = false,
}: {
  items: CatalogItem[];
  todayBill: BillLine[];
  recent: CatalogItem[];
  categories: ItemCategory[];
  isAdmin?: boolean;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(items);
  const [recentItems, setRecentItems] = useState<CatalogItem[]>(recent);
  const [categories, setCategories] = useState<ItemCategory[]>(initialCategories);
  const [categoryFilter, setCategoryFilter] = useState("All");

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

  function handleCategoryCreate(category: ItemCategory) {
    setCategories((prev) => {
      if (prev.some((c) => c.id === category.id)) return prev;
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  const filterOptions = useMemo(
    () => ["All", ...categories.map((c) => c.name)],
    [categories],
  );

  const filteredCatalog = useMemo(() => {
    if (categoryFilter === "All") return catalog;
    const selected = categories.find((c) => c.name === categoryFilter);
    if (!selected) return catalog;
    return catalog.filter((item) => item.categoryId === selected.id);
  }, [catalog, categories, categoryFilter]);

  const progressPct = Math.min(100, Math.round((total / DEFAULT_DAILY_TARGET) * 100));

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <HomeBillHeader
        isAdmin={isAdmin}
        count={count}
        total={total}
        progressPct={progressPct}
        onViewBill={() => setBillOpen(true)}
      />

      {/* Content sheet sits on mint background below the green hero */}
      <main className="relative z-10 flex-1 space-y-8 bg-background px-4 pb-28 pt-6">
        {recentItems.length > 0 && (
          <RecentTaps
            items={recentItems}
            onItemTap={bumpRecent}
            onClear={() => setRecentItems([])}
            onAdd={() => setAddOpen(true)}
          />
        )}

        <Section
          title="All Items"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="rounded-xl border-border"
            >
              <Plus className="size-4" />
              Add
            </Button>
          }
        >
          <FilterChips
            options={filterOptions}
            active={categoryFilter}
            onChange={setCategoryFilter}
            className="-mx-1 flex-nowrap overflow-x-auto px-1 pb-1"
          />
          <ItemGrid items={filteredCatalog} onItemTap={bumpRecent} />
        </Section>
      </main>

      <BillSheet open={billOpen} onOpenChange={setBillOpen} />
      <AddItemSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreate={handleCreate}
        categories={categories}
        onCategoryCreate={handleCategoryCreate}
      />
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
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Server-rendered placeholder shown while the page loads its data. */
export function BillingScreenSkeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <Skeleton className="h-40 w-full rounded-none bg-primary/80" />
      <div className="space-y-8 px-4 pt-6">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="min-h-[168px] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
