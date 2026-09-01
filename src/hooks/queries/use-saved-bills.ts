"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSavedBills } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { Paginated, SavedBill } from "@/types/bill";

export function useSavedBills(
  userId: string,
  page: number,
  opts: { initialData?: Paginated<SavedBill>; enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.savedBills(userId, page),
    queryFn: () => fetchSavedBills(page),
    initialData: opts.initialData,
    enabled: opts.enabled ?? page > 1,
  });
}
