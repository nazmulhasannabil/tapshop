"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
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
  const { addItem } = useBill();
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
        "focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "w-[116px] shrink-0" : "w-full",
      )}
    >
      <span className={cn("leading-none", compact ? "text-2xl" : "text-3xl")}>
        {item.icon ?? "🍽️"}
      </span>

      <div className="mt-2 min-w-0">
        <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {item.name}
        </span>
        <span className="tnum mt-0.5 block text-sm font-medium text-primary">
          {formatCurrency(item.price)}
        </span>
      </div>

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
