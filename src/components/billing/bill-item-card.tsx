"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { displayedQty, useBillEntry } from "@/stores/bill-store";
import { useBill } from "@/hooks/use-bill";
import type { CatalogItem } from "@/types/bill";

export function BillItemCard({
  item,
  compact = false,
  onTap,
}: {
  item: CatalogItem;
  compact?: boolean;
  onTap?: (item: CatalogItem) => void;
}) {
  const entry = useBillEntry(item.id);
  const qty = displayedQty(entry);
  const { addItem, decreaseItem } = useBill();
  const [pop, setPop] = useState(0);
  const reactId = useId();

  function handleTap() {
    addItem(item);
    onTap?.(item);
    setPop((p) => p + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTap();
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`Add one ${item.name}, ${formatCurrency(item.price)}`}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group relative flex select-none flex-col overflow-hidden rounded-2xl bg-card p-3 text-left outline-none transition-all",
        "border border-border shadow-sm focus-visible:ring-2 focus-visible:ring-ring",
        qty > 0 && "border-primary/40 bg-accent/40 shadow-md shadow-primary/5",
        compact ? "w-[116px] shrink-0" : "min-h-[168px] w-full",
      )}
    >
      {/* Emoji image well */}
      <div
        className={cn(
          "relative mx-auto flex items-center justify-center rounded-2xl bg-accent",
          compact ? "size-14" : "aspect-square w-full max-h-[88px]",
        )}
      >
        <span className={cn("leading-none drop-shadow-sm", compact ? "text-2xl" : "text-4xl")}>
          {item.icon ?? "🍽️"}
        </span>

        {qty > 0 && (
          <span className="tnum absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
            {qty}
          </span>
        )}

        {qty > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              decreaseItem(item.id);
            }}
            aria-label={`Remove one ${item.name}`}
            className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-card text-foreground shadow-sm ring-1 ring-border transition hover:bg-destructive/10 hover:text-destructive active:scale-90"
          >
            <Minus className="size-3.5" />
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-1 flex-col pr-8">
        <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {item.name}
        </span>
        <span className="tnum mt-1 text-sm font-medium text-primary">
          {formatCurrency(item.price)}
        </span>
      </div>

      {/* EcoEats-style green + affordance */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleTap();
        }}
        aria-label={`Add one ${item.name}`}
        className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-90"
      >
        <Plus className="size-4" strokeWidth={2.5} />
      </button>

      {/* "+1" float on each tap */}
      <AnimatePresence>
        {pop > 0 && (
          <motion.span
            key={`${reactId}-${pop}`}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, -6, -26], scale: [0.7, 1.1, 1] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-primary"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
