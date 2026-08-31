"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { BillLine } from "@/types/bill";
import type { StatsData } from "@/lib/services/stats";
import { useBillStore } from "@/stores/bill-store";
import { useStatsStore } from "@/stores/stats-store";

/**
 * Hydrates bill + stats stores from server props and keeps stats fresh.
 * Renders `children` so Activity (or other screens) can compose the UI.
 */
export function StatsProvider({
  initialStats,
  todayBill,
  children,
}: {
  initialStats: StatsData;
  todayBill: BillLine[];
  children: ReactNode;
}) {
  const hydrated = useStatsStore((s) => s.serverStats !== null);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatsKey = useRef<string | null>(null);

  useEffect(() => {
    if (!useBillStore.getState().hydrated) {
      useBillStore.getState().hydrate(todayBill);
    }
  }, [todayBill]);

  useEffect(() => {
    const key = JSON.stringify(initialStats);
    if (!hydrated) {
      useStatsStore.getState().hydrate(initialStats);
      lastStatsKey.current = key;
      return;
    }
    if (lastStatsKey.current === key) return;
    lastStatsKey.current = key;
    useStatsStore.getState().refreshFromServer(initialStats);
  }, [hydrated, initialStats]);

  useEffect(() => {
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const body = (await res.json()) as { ok: boolean; data?: StatsData };
        if (body.ok && body.data) {
          useStatsStore.getState().refreshFromServer(body.data);
        }
      } catch {
        // Silently ignore — live derivation still works.
      }
    };

    refreshInterval.current = setInterval(tick, 60_000);

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  return <>{children}</>;
}
