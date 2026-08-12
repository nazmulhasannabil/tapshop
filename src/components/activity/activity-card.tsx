"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import type { ActivityEntry } from "@/types/bill";

/**
 * A single transaction card on the activity timeline. Tapping it opens the
 * details view via `onSelect`.
 */
export function ActivityCard({
  entry,
  onSelect,
}: {
  entry: ActivityEntry;
  onSelect: (entry: ActivityEntry) => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(entry);
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${entry.name}, ${formatCurrency(entry.subtotal)}, ${formatRelativeTime(entry.updatedAt)}`}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "flex min-w-0 flex-1 select-none items-center gap-3 rounded-3xl bg-card p-4 text-left",
        "shadow-sm ring-1 ring-foreground/5 outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {/* Category icon */}
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent">
        <span className="text-2xl leading-none">{entry.icon ?? "🍽️"}</span>
      </div>

      {/* Product info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-semibold text-foreground">
            {entry.name}
          </span>
          <span className="inline-flex shrink-0 items-center rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-success-foreground">
            +{entry.quantity}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatRelativeTime(entry.updatedAt)}
        </p>
      </div>

      {/* Amount */}
      <span className="tnum ml-auto shrink-0 text-xl font-bold text-foreground">
        {formatCurrency(entry.subtotal)}
      </span>
    </motion.div>
  );
}
