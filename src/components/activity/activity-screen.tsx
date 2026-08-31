"use client";

import { useState } from "react";
import { EmptyState } from "@/components/billing/empty-state";
import { StatsOverview } from "@/components/stats/stats-overview";
import type { Paginated, SavedBill } from "@/types/bill";
import { SavedBillsTable } from "@/components/saved-bills/saved-bills-table";
import { SavedBillDetailSheet } from "@/components/saved-bills/saved-bill-detail-sheet";

/**
 * Activity screen: spend stats overview on top, then paginated saved bills.
 */
export function ActivityScreen({ page }: { page: Paginated<SavedBill> }) {
  const [selected, setSelected] = useState<SavedBill | null>(null);
  const open = selected !== null;

  function handleClose(next: boolean) {
    if (!next) setSelected(null);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <main className="flex-1 space-y-8 px-4 pb-28 pt-6">
        <StatsOverview />

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Saved Bills
            </h2>
            <p className="text-sm text-muted-foreground">
              Snapshots of the bills you&apos;ve saved.
            </p>
          </div>

          {page.items.length > 0 || page.total > 0 ? (
            page.items.length > 0 ? (
              <SavedBillsTable page={page} onSelect={setSelected} />
            ) : (
              <EmptyState
                icon="🧾"
                title="Nothing on this page"
                description="Try going back to the previous page."
              />
            )
          ) : (
            <EmptyState
              icon="🧾"
              title="No saved bills yet"
              description="Save a bill from the home screen and it'll appear here."
            />
          )}
        </div>
      </main>

      <SavedBillDetailSheet bill={selected} open={open} onOpenChange={handleClose} />
    </div>
  );
}
