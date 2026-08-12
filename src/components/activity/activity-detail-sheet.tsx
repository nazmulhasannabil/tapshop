"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import type { ActivityEntry } from "@/types/bill";

/**
 * Bottom sheet showing the full details of a tapped activity entry.
 */
export function ActivityDetailSheet({
  entry,
  open,
  onOpenChange,
}: {
  entry: ActivityEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-3xl p-0">
        {entry && <DetailBody entry={entry} />}
      </SheetContent>
    </Sheet>
  );
}

function DetailBody({ entry }: { entry: ActivityEntry }) {
  const when = new Date(entry.updatedAt);

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle className="text-center text-lg">Transaction</SheetTitle>
        <SheetDescription className="text-center">
          {formatRelativeTime(entry.updatedAt)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col items-center gap-2 px-6 py-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent">
          <span className="text-3xl leading-none">{entry.icon ?? "🍽️"}</span>
        </div>
        <p className="mt-1 text-xl font-bold text-foreground">{entry.name}</p>
        <span className="inline-flex items-center rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-success-foreground">
          +{entry.quantity}
        </span>
      </div>

      <dl className="divide-y divide-border border-y">
        <Row label="Amount" value={formatCurrency(entry.subtotal)} emphasized />
        <Row
          label="Unit price"
          value={`${entry.quantity} × ${formatCurrency(entry.unitPrice)}`}
        />
        <Row
          label="When"
          value={when.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        />
      </dl>
    </>
  );
}

function Row({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasized
            ? "tnum text-lg font-bold text-foreground"
            : "tnum text-sm font-medium text-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}
