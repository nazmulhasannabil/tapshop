"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import type { SavedBill } from "@/types/bill";

/**
 * Bottom sheet showing the full item breakdown of a saved bill (the read-only
 * "list of items and total" view for a row in the Saved Bills table).
 */
export function SavedBillDetailSheet({
  bill,
  open,
  onOpenChange,
}: {
  bill: SavedBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-3xl p-0">
        {bill && <DetailBody bill={bill} />}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({ bill }: { bill: SavedBill }) {
  const when = new Date(bill.createdAt);

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="text-center text-lg">Saved Bill</SheetTitle>
        <SheetDescription className="text-center">
          {formatBillDate(bill.billDate)} · saved {formatRelativeTime(bill.createdAt)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        {bill.items.map((item, index) => (
          <div
            key={`${bill.id}-${index}`}
            className="flex items-center gap-3 border-b border-border py-3 last:border-0"
          >
            <span className="text-2xl leading-none">{item.icon ?? "🍽️"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="tnum text-xs text-muted-foreground">
                {item.quantity} × {formatCurrency(item.unitPrice)} ={" "}
                {formatCurrency(item.subtotal)}
              </p>
            </div>
            <span className="tnum text-sm font-semibold">
              {formatCurrency(item.subtotal)}
            </span>
          </div>
        ))}
      </div>

      <SheetFooter className="border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total · {bill.itemCount} {bill.itemCount === 1 ? "item" : "items"}
          </span>
          <span className="tnum text-2xl font-bold tracking-tight text-primary">
            {formatCurrency(bill.total)}
          </span>
        </div>
        <p className="tnum text-center text-xs text-muted-foreground">
          {when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </SheetFooter>
    </>
  );
}

/** Format a YYYY-MM-DD bill date as a readable label. */
function formatBillDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}
