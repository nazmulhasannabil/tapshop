"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus } from "lucide-react";
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
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group relative flex select-none flex-col items-center justify-center overflow-hidden rounded-2xl bg-card p-4 text-center ring-1 ring-foreground/10 outline-none transition-all",
        "min-h-[132px] focus-visible:ring-2 focus-visible:ring-ring",
        qty > 0 && "ring-2 ring-primary shadow-md",
        compact ? "w-[116px] shrink-0" : "aspect-square w-full",
      )}
    >
      <span className={cn("leading-none drop-shadow-sm", compact ? "text-2xl" : "text-4xl")}>
        {item.icon ?? "🍽️"}
      </span>
      <span className="mt-2 line-clamp-2 text-sm font-medium leading-tight">{item.name}</span>
      <span className="tnum mt-0.5 text-xs text-muted-foreground">
        {formatCurrency(item.price)}
      </span>

      {qty > 0 && (
        <span className="tnum absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
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
          className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm ring-1 ring-foreground/10 transition hover:bg-destructive/10 hover:text-destructive active:scale-90"
        >
          <Minus className="size-4" />
        </button>
      )}

      {/* "+1" float on each tap */}
      <AnimatePresence>
        {pop > 0 && (
          <motion.span
            key={`${reactId}-${pop}`}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, -6, -26], scale: [0.7, 1.1, 1] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-primary"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
