"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStats } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { StatsData } from "@/lib/services/stats";
import { fetchSavedBills } from "@/lib/query/fetchers";

export function useStats(
  userId: string,
  opts: {
    initialData?: StatsData;
    refetchInterval?: number | false;
    enabled?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: queryKeys.stats(userId),
    queryFn: fetchStats,
    initialData: opts.initialData,
    refetchInterval: opts.refetchInterval,
    enabled: opts.enabled ?? true,
  });
}

export function prefetchActivity(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.stats(userId),
    queryFn: fetchStats,
  });
  void queryClient.prefetchQuery({
    queryKey: queryKeys.savedBills(userId, 1),
    queryFn: () => fetchSavedBills(1),
  });
}

export function invalidateStats(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.stats(userId) });
}

export function invalidateSavedBills(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["savedBills", userId] });
}
