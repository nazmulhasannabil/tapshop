"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { BillLine } from "@/types/bill";
import type { StatsData } from "@/lib/services/stats";
import { useHydrateBillStore } from "@/hooks/use-hydrate-bill-store";
import { useStats } from "@/hooks/queries/use-stats";
import { useStatsStore } from "@/stores/stats-store";

/**
 * Hydrates bill + stats stores from server props and keeps stats fresh.
 * Renders `children` so Activity (or other screens) can compose the UI.
 */
export function StatsProvider({
  userId,
  initialStats,
  todayBill,
  children,
}: {
  userId: string;
  initialStats: StatsData;
  todayBill: BillLine[];
  children: ReactNode;
}) {
  const hydrated = useStatsStore((s) => s.serverStats !== null);
  const lastStatsKey = useRef<string | null>(null);

  useHydrateBillStore(todayBill);

  const { data: stats } = useStats(userId, {
    initialData: initialStats,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!stats) return;
    const key = JSON.stringify(stats);
    if (!hydrated) {
      useStatsStore.getState().hydrate(stats);
      lastStatsKey.current = key;
      return;
    }
    if (lastStatsKey.current === key) return;
    lastStatsKey.current = key;
    useStatsStore.getState().refreshFromServer(stats);
  }, [hydrated, stats]);

  return <>{children}</>;
}
