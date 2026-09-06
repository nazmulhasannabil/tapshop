"use client";

import { ChevronDown, Plus } from "lucide-react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib/constants";
import { displayedQty, useBillEntry } from "@/stores/bill-store";
import { useBill } from "@/hooks/use-bill";
import type { CatalogItem } from "@/types/bill";

/**
 * White card with recent-tap chips, Clear All, and a trailing + to add an item.
 * Tapping a chip still adds one and bubbles it to the front via `onItemTap`.
 */
export function RecentTaps({
  items,
  onItemTap,
  onClear,
  onAdd,
}: {
  items: CatalogItem[];
  onItemTap?: (item: CatalogItem) => void;
  onClear?: () => void;
  onAdd?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1 text-left"
          aria-label={`Recent Taps, ${items.length} items`}
        >
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Recent Taps{" "}
            <span className="font-bold text-foreground">({items.length})</span>
          </h2>
          <ChevronDown className="size-4 text-foreground" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-primary transition hover:opacity-80 active:scale-95"
        >
          Clear All
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="no-scrollbar flex min-w-0 flex-1 gap-2.5 overflow-x-auto">
          {items.map((item) => (
            <RecentChip key={item.id} item={item} onTap={onItemTap} />
          ))}
        </div>

        <div
          aria-hidden
          className="h-10 w-px shrink-0 self-center bg-border"
        />

        <button
          type="button"
          onClick={onAdd}
          aria-label="Add new item"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary transition hover:bg-accent/80 active:scale-95"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}

function RecentChip({
  item,
  onTap,
}: {
  item: CatalogItem;
  onTap?: (item: CatalogItem) => void;
}) {
  const entry = useBillEntry(item.id);
  const qty = displayedQty(entry);
  const { addItem } = useBill();

  function handleTap() {
    addItem(item);
    onTap?.(item);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTap();
    }
  }

  return (
    <motion.button
      type="button"
      aria-label={`Add one ${item.name}, ${formatCurrency(item.price)}`}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="group flex shrink-0 items-center gap-2 rounded-2xl bg-accent py-1.5 pl-1.5 pr-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-lg leading-none shadow-sm ring-1 ring-border/50">
        {item.icon ?? "🍽️"}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold text-foreground">
          {item.name}
        </span>
        <span className="tnum text-xs font-semibold text-primary">
          {formatCurrency(item.price)}
        </span>
      </span>
      {qty > 0 && (
        <span className="tnum ml-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          x{qty}
        </span>
      )}
    </motion.button>
  );
}
