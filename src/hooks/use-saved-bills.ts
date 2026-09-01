"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { postJson } from "@/lib/api/client";
import {
  invalidateSavedBills,
  invalidateStats,
} from "@/hooks/queries/use-stats";
import { useBillStore } from "@/stores/bill-store";
import type { ApiResult, SaveBillResult } from "@/types/bill";

/**
 * Saves the current "Today's Bill" as an immutable snapshot.
 *
 * The server snapshots today's `bill_entries` and then clears them, so on
 * success we mirror that by clearing the optimistic store — the home card
 * immediately empties and is ready to build the next bill.
 */
export function useSavedBill(userId: string) {
  const queryClient = useQueryClient();

  const saveBill = useCallback(async (): Promise<ApiResult<SaveBillResult>> => {
    const res = await postJson<SaveBillResult>("/api/bill/save");
    if (res.ok) {
      useBillStore.getState().clear();
      invalidateStats(queryClient, userId);
      invalidateSavedBills(queryClient, userId);
      toast.success("Bill saved", {
        description: "Today's bill cleared — ready for the next one.",
      });
    } else {
      toast.error(res.error || "Couldn't save that bill.");
    }
    return res;
  }, [queryClient, userId]);

  return { saveBill };
}
