"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patchJson, postJson, unwrap } from "@/lib/api/client";
import {
  fetchDebtGroups,
  fetchDebtSummary,
} from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { DebtDto, DebtGroup, DebtSummary } from "@/lib/services/debts";
import { DEBT_STATUS } from "@/lib/social-constants";

function invalidateDebtQueries(queryClient: ReturnType<typeof useQueryClient>, userId: string) {
  void queryClient.invalidateQueries({ queryKey: ["debts", "summary", userId] });
  void queryClient.invalidateQueries({ queryKey: ["debts", "groups", userId] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
}

export function useDebtsSummary(userId: string, initialData?: DebtSummary) {
  return useQuery({
    queryKey: queryKeys.debts.summary(userId),
    queryFn: fetchDebtSummary,
    initialData,
  });
}

export function useDebtGroups(
  userId: string,
  opts: {
    status?: string;
    friendUserId?: string;
    enabled?: boolean;
    initialData?: DebtGroup[];
  } = {},
) {
  const status = opts.status ?? DEBT_STATUS.OPEN;
  return useQuery({
    queryKey: queryKeys.debts.groups(userId, status, opts.friendUserId),
    queryFn: () => fetchDebtGroups(status, opts.friendUserId),
    enabled: opts.enabled ?? true,
    initialData: opts.initialData,
  });
}

export function useSettleDebt(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (debtId: string) =>
      unwrap(
        await patchJson<DebtDto>(`/api/debts/${debtId}`, {
          status: DEBT_STATUS.SETTLED,
        }),
      ),
    onSuccess: () => invalidateDebtQueries(queryClient, userId),
  });
}

export function useCreateDebt(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: unknown) =>
      unwrap(await postJson<DebtDto>("/api/debts", body)),
    onSuccess: () => invalidateDebtQueries(queryClient, userId),
  });
}

export function useInvalidateDebts(userId: string) {
  const queryClient = useQueryClient();
  return () => invalidateDebtQueries(queryClient, userId);
}

/** Prefetch helpers for nav hover. */
export function prefetchDebts(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.debts.summary(userId),
    queryFn: fetchDebtSummary,
  });
  void queryClient.prefetchQuery({
    queryKey: queryKeys.debts.groups(userId, DEBT_STATUS.OPEN),
    queryFn: () => fetchDebtGroups(DEBT_STATUS.OPEN),
  });
}
