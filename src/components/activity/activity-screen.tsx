"use client";

import { useState } from "react";
import { EmptyState } from "@/components/billing/empty-state";
import type { ActivityEntry } from "@/types/bill";
import { ActivityTimeline } from "./activity-timeline";
import { ActivityDetailSheet } from "./activity-detail-sheet";

/**
 * The Recent Activity screen body. Server-fetched `entries` are rendered as a
 * timeline; tapping a card opens a details sheet.
 */
export function ActivityScreen({ entries }: { entries: ActivityEntry[] }) {
  const [selected, setSelected] = useState<ActivityEntry | null>(null);
  const open = selected !== null;

  function handleClose(next: boolean) {
    if (!next) setSelected(null);
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <main className="flex-1 space-y-6 px-4 pb-28 pt-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Recent Activity
          </h2>
          <p className="text-sm text-muted-foreground">
            Your latest taps and transactions.
          </p>
        </div>

        {entries.length > 0 ? (
          <ActivityTimeline entries={entries} onSelect={setSelected} />
        ) : (
          <EmptyState
            icon="🧾"
            title="No activity yet"
            description="Your taps and transactions will show up here."
          />
        )}
      </main>

      <ActivityDetailSheet
        entry={selected}
        open={open}
        onOpenChange={handleClose}
      />
    </div>
  );
}
