"use client";

import { useEffect, useRef } from "react";
import type { StatsData } from "@/lib/services/stats";
import { useStatsStore } from "@/stores/stats-store";
import { StatsScreen } from "./stats-screen";

/**
 * Thin client wrapper that:
 *  1. Hydrates the stats store with server-fetched data on first mount.
 *  2. Refreshes the server baseline whenever the server component re-renders
 *     (e.g. user navigates back to /stats).
 *  3. Periodically refetches from /api/stats to keep mostUsed / itemsTapped
 *     accurate even after long sessions.
 */
export function StatsProvider({
  initialStats,
}: {
  initialStats: StatsData;
}) {
  const hydrated = useStatsStore((s) => s.serverStats !== null);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate on mount and update baseline on every server re-render.
  useEffect(() => {
    if (!hydrated) {
      useStatsStore.getState().hydrate(initialStats);
    } else {
      useStatsStore.getState().refreshFromServer(initialStats);
    }
  }); // no deps = runs on every render (intentional — server props update on revisit)

  // Periodic server refresh every 60 seconds for non-today data accuracy.
  useEffect(() => {
    refreshInterval.current = setInterval(async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const body = (await res.json()) as { ok: boolean; data?: StatsData };
        if (body.ok && body.data) {
          useStatsStore.getState().refreshFromServer(body.data);
        }
      } catch {
        // Silently ignore network errors — live derivation still works.
      }
    }, 60_000);

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  return <StatsScreen />;
}
