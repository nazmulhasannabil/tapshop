"use client";

import { motion } from "motion/react";
import { formatCurrency } from "@/lib/constants";
import { displayedQty, useBillEntry } from "@/stores/bill-store";
import { useBill } from "@/hooks/use-bill";
import type { CatalogItem } from "@/types/bill";

/**
 * Horizontally scrollable row of "recent tap" chips. Each chip is a tappable
 * pill (emoji + name + price) with an indigo ×N indicator for the live bill
 * quantity. Tapping adds one and bubbles the item to the front of the list.
 */
export function RecentTaps({
  items,
  onItemTap,
}: {
  items: CatalogItem[];
  onItemTap?: (item: CatalogItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
      {items.map((item) => (
        <RecentChip key={item.id} item={item} onTap={onItemTap} />
      ))}
    </div>
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
      className="group flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-accent py-2 pl-3 pr-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-lg leading-none">{item.icon ?? "🍽️"}</span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">{item.name}</span>
        <span className="tnum text-xs text-muted-foreground">
          {formatCurrency(item.price)}
        </span>
      </span>
      {qty > 0 && (
        <span className="tnum ml-0.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
          ×{qty}
        </span>
      )}
    </motion.button>
  );
}
