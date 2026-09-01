"use client";

import { useState } from "react";
import { EmptyState } from "@/components/billing/empty-state";
import { SavedBillsTable } from "@/components/saved-bills/saved-bills-table";
import { SavedBillDetailSheet } from "@/components/saved-bills/saved-bill-detail-sheet";
import type { Paginated, SavedBill } from "@/types/bill";

/** Client wrapper for the streamed saved-bills table + detail sheet. */
export function SavedBillsTableSection({ page }: { page: Paginated<SavedBill> }) {
  const [selected, setSelected] = useState<SavedBill | null>(null);
  const open = selected !== null;

  function handleClose(next: boolean) {
    if (!next) setSelected(null);
  }

  return (
    <>
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

      <SavedBillDetailSheet bill={selected} open={open} onOpenChange={handleClose} />
    </>
  );
}
