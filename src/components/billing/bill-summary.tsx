"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { useBillTotals } from "@/stores/bill-store";
import { AnimatedTotal } from "./animated-total";

/**
 * Floating green bill action bar. Fixed above the bottom navigation so it stays
 * reachable while scrolling. Tapping opens the detailed bill sheet.
 */
export function BillSummary({ onOpen }: { onOpen: () => void }) {
  const { count, total } = useBillTotals();
  const hasItems = count > 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+0.75rem)] z-30">
      <div className="mx-auto w-full max-w-md px-4">
        <button
          type="button"
          onClick={hasItems ? onOpen : undefined}
          disabled={!hasItems}
          aria-label="View bill"
          className={cn(
            "pointer-events-auto flex w-full items-center justify-between gap-3 rounded-3xl bg-success px-4 py-3.5 text-success-foreground shadow-lg shadow-success/30 transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !hasItems && "opacity-60",
          )}
        >
          <span className="flex items-center gap-3">
            <span className="rounded-full bg-success-foreground/20 px-2.5 py-1 text-xs font-semibold">
              {hasItems ? `${count} ${count === 1 ? "item" : "items"}` : "No items"}
            </span>
            <AnimatedTotal
              value={total}
              className="text-2xl font-bold tracking-tight"
            />
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            View Bill
            <ArrowRight className="size-4" />
          </span>
        </button>
      </div>
    </div>
  );
}

/** Kept for reuse — formats a standalone total (e.g. headers). */
export function TotalText({ value }: { value: number }) {
  return <span className="tnum">{formatCurrency(value)}</span>;
}
