"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useBillStore } from "@/stores/bill-store";
import type { ApiResult, SaveBillResult } from "@/types/bill";

async function postJson<T>(url: string): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
    });
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, error: "Network hiccup — check your connection." };
  }
}

/**
 * Saves the current "Today's Bill" as an immutable snapshot.
 *
 * The server snapshots today's `bill_entries` and then clears them, so on
 * success we mirror that by clearing the optimistic store — the home card
 * immediately empties and is ready to build the next bill.
 */
export function useSavedBill() {
  const saveBill = useCallback(async (): Promise<ApiResult<SaveBillResult>> => {
    const res = await postJson<SaveBillResult>("/api/bill/save");
    if (res.ok) {
      useBillStore.getState().clear();
      toast.success("Bill saved", {
        description: "Today's bill cleared — ready for the next one.",
      });
    } else {
      toast.error(res.error || "Couldn't save that bill.");
    }
    return res;
  }, []);

  return { saveBill };
}
