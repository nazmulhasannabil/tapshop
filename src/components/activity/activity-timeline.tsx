"use client";

import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/types/bill";
import { ActivityCard } from "./activity-card";

/**
 * Vertical transaction timeline. A thin indigo rail runs down the left gutter
 * with a node per entry (newest highlighted, others soft lavender); each card
 * sits to the right of its node.
 *
 * The rail is drawn per-row from the node down through the row gap so it stays
 * continuous node-to-node regardless of card heights. Nodes are anchored at the
 * vertical center of each card's icon (top-10 = 2.5rem).
 */
export function ActivityTimeline({
  entries,
  onSelect,
}: {
  entries: ActivityEntry[];
  onSelect: (entry: ActivityEntry) => void;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const isNewest = index === 0;
        return (
          <li key={entry.id} className="flex gap-3">
            {/* Node gutter — stretches to card height (default align-items). */}
            <div className="relative w-10 shrink-0">
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-10 h-[calc(100%_+_0.75rem)] w-px -translate-x-1/2 bg-primary/20"
                />
              )}
              <span
                aria-hidden
                className={cn(
                  "absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 rounded-full",
                  isNewest
                    ? "size-4 bg-primary ring-4 ring-primary/15"
                    : "size-3.5 bg-accent ring-1 ring-primary/15",
                )}
              />
            </div>
            <ActivityCard entry={entry} onSelect={onSelect} />
          </li>
        );
      })}
    </ol>
  );
}
