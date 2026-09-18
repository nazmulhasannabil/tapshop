"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { FilterChips } from "@/components/admin/filter-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { useBill } from "@/hooks/use-bill";
import { useHydrateBillStore } from "@/hooks/use-hydrate-bill-store";
import { useBillTotals } from "@/stores/bill-store";
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
  userName,
}: {
  items: CatalogItem[];
  todayBill: BillLine[];
  recent: CatalogItem[];
  categories: ItemCategory[];
  isAdmin?: boolean;
  userName?: string | null;
}) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(items);
  const [recentItems, setRecentItems] = useState<CatalogItem[]>(recent);
  const [categories, setCategories] = useState<ItemCategory[]>(initialCategories);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [billOpen, setBillOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);

  const { deleteItem } = useBill();
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

  function handleUpdate(item: CatalogItem) {
    setCatalog((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setRecentItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  }

  async function handleDelete(item: CatalogItem) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    const res = await deleteItem(item.id);
    if (!res.ok) return;
    setCatalog((prev) => prev.filter((i) => i.id !== item.id));
    setRecentItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success(`${item.name} deleted`);
  }

  function handleCategoryCreate(category: ItemCategory) {
    setCategories((prev) => {
      if (prev.some((c) => c.id === category.id)) return prev;
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  function openCreate() {
    setEditItem(null);
    setAddOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditItem(item);
    setAddOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setAddOpen(open);
    if (!open) setEditItem(null);
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

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background">
      <HomeBillHeader
        isAdmin={isAdmin}
        userName={userName}
        count={count}
        total={total}
        onViewBill={() => setBillOpen(true)}
      />

      <main className="relative z-10 flex-1 space-y-6 px-5 pb-28 pt-3">
        {recentItems.length > 0 && (
          <RecentTaps
            items={recentItems}
            onItemTap={bumpRecent}
            onClear={() => setRecentItems([])}
          />
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white">All Items</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
                {filteredCatalog.length}
              </span>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-primary/40 hover:text-white active:scale-95"
            >
              <Plus className="size-3.5 text-primary" strokeWidth={2.5} />
              New Items
            </button>
          </div>

          <FilterChips
            options={filterOptions}
            active={categoryFilter}
            onChange={setCategoryFilter}
            className="-mx-1 flex-nowrap overflow-x-auto px-1 py-1"
          />
          <ItemGrid
            items={filteredCatalog}
            onItemTap={bumpRecent}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <BillSheet open={billOpen} onOpenChange={setBillOpen} />
      <AddItemSheet
        open={addOpen}
        onOpenChange={handleSheetOpenChange}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        editItem={editItem}
        categories={categories}
        onCategoryCreate={handleCategoryCreate}
      />
    </div>
  );
}

/** Server-rendered placeholder shown while the page loads its data. */
export function BillingScreenSkeleton() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-2">
      <Skeleton className="mb-3 h-10 w-40 rounded-xl bg-muted" />
      <Skeleton className="h-36 w-full rounded-2xl bg-emerald-950/60" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-5 w-28 bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
