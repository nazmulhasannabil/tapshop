"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { formatCurrency } from "@/lib/constants";
import { displayedQty, useBillEntry } from "@/stores/bill-store";
import { useBill } from "@/hooks/use-bill";
import type { CatalogItem } from "@/types/bill";
import { ItemVisual } from "./item-visual";

/**
 * Recent taps row — chips for quick re-add.
 * Tapping a chip still adds one and bubbles it to the front via `onItemTap`.
 */
export function RecentTaps({
  items,
  onItemTap,
  onClear,
}: {
  items: CatalogItem[];
  onItemTap?: (item: CatalogItem) => void;
  onClear?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-1 text-left"
          aria-label={`Recent Taps, ${items.length} items`}
        >
          <h2 className="text-base font-bold tracking-tight text-white">
            Recent Taps{" "}
            <span className="font-bold text-slate-400">({items.length})</span>
          </h2>
          <ChevronDown className="size-4 text-slate-400" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold text-primary transition hover:opacity-80 active:scale-95"
        >
          Clear All
        </button>
      </div>

      <div className="no-scrollbar flex justify-start gap-2.5 overflow-x-auto">
        {items.map((item) => (
          <RecentChip key={item.id} item={item} onTap={onItemTap} />
        ))}
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
      className="group flex shrink-0 items-center gap-2 rounded-2xl py-1.5 pr-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card text-lg leading-none shadow-sm ring-1 ring-border/50">
        <ItemVisual
          icon={item.icon}
          name={item.name}
          className="absolute inset-0"
          emojiClassName="relative flex size-full items-center justify-center text-lg"
        />
      </span>
      <span className="flex min-w-0 flex-col items-start text-left leading-tight">
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
