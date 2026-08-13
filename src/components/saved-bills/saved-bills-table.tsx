"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime } from "@/lib/constants";
import type { Paginated, SavedBill } from "@/types/bill";

/**
 * Paginated table of a user's saved bills. Rows are tappable and open the
 * detail sheet (handled by the parent). Pagination is URL-driven via
 * `?page=N` using `next/link`, so it's idiomatic, shareable, and renders on the
 * server.
 */
export function SavedBillsTable({
  page,
  onSelect,
}: {
  page: Paginated<SavedBill>;
  onSelect: (bill: SavedBill) => void;
}) {
  const { items, page: current, totalPages, total } = page;
  const hasPrev = current > 1;
  const hasNext = current < totalPages;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-semibold">
                Date
              </th>
              <th scope="col" className="px-2 py-2.5 text-center font-semibold">
                Items
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((bill) => (
              <tr
                key={bill.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(bill)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(bill);
                  }
                }}
                className="cursor-pointer border-t border-border bg-card transition hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{formatBillDate(bill.billDate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(bill.createdAt)}
                  </p>
                </td>
                <td className="px-2 py-3 text-center tnum text-muted-foreground">
                  {bill.itemCount}
                </td>
                <td className="px-4 py-3 text-right tnum font-semibold text-foreground">
                  {formatCurrency(bill.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        current={current}
        totalPages={totalPages}
        total={total}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  );
}

/** Prev / "Page X of Y" / Next controls, driven by `?page=N` links. */
function Pagination({
  current,
  totalPages,
  total,
  hasPrev,
  hasNext,
}: {
  current: number;
  totalPages: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const pageHref = (n: number) => `/activity?page=${n}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {total === 0 ? "No bills yet" : `Page ${current} of ${totalPages}`}
      </span>
      <div className="flex items-center gap-1.5">
        {hasPrev ? (
          <Link
            href={pageHref(current - 1)}
            aria-label="Previous page"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled aria-disabled="true">
            <ChevronLeft className="size-4" />
            Prev
          </Button>
        )}
        {hasNext ? (
          <Link
            href={pageHref(current + 1)}
            aria-label="Next page"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled aria-disabled="true">
            Next
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Format a YYYY-MM-DD bill date as a readable label. */
function formatBillDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}
