"use client";

import { ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/constants";
import { useBillTotals } from "@/stores/bill-store";
import { AnimatedTotal } from "./animated-total";

/** Persistent bottom "game-HUD" bill summary. Stays visible while scrolling. */
export function BillSummary({ onOpen }: { onOpen: () => void }) {
  const { count, total } = useBillTotals();
  const hasItems = count > 0;

  return (
    <div className="sticky bottom-0 z-30 mt-auto">
      <div
        className="border-t border-border bg-background/85 px-4 backdrop-blur-md"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      >
        <button
          type="button"
          onClick={onOpen}
          disabled={!hasItems}
          className="mx-auto flex w-full max-w-md items-center justify-between gap-3 py-3 disabled:opacity-70"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="text-xs text-muted-foreground">
              {hasItems ? `${count} ${count === 1 ? "item" : "items"}` : "Nothing yet"}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-primary/90">
              View Bill
              <ChevronUp className="size-4" />
            </span>
          </span>
          <AnimatedTotal
            value={total}
            className="text-2xl font-bold tracking-tight text-foreground"
          />
        </button>
      </div>
    </div>
  );
}

/** Kept for reuse — formats a standalone total (e.g. headers). */
export function TotalText({ value }: { value: number }) {
  return <span className="tnum">{formatCurrency(value)}</span>;
}
