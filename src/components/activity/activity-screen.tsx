"use client";

import type { ReactNode } from "react";
import { StatsOverview } from "@/components/stats/stats-overview";

/**
 * Activity screen: spend stats overview on top, saved bills streamed below.
 */
export function ActivityScreen({ children }: { children: ReactNode }) {
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

          {children}
        </div>
      </main>
    </div>
  );
}
