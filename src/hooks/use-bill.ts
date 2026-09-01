"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { postJson } from "@/lib/api/client";
import { useBillStore } from "@/stores/bill-store";
import type {
  AddItemResult,
  ApiResult,
  CatalogItem,
  DecreaseItemResult,
} from "@/types/bill";

/**
 * Wires the optimistic Zustand store to the /api/bill route handlers.
 *
 * The returned callbacks are stable (no re-renders); components subscribe to
 * store state via the selectors in `bill-store`.
 */
export function useBill() {
  const addItem = useCallback(async (item: CatalogItem) => {
    const store = useBillStore.getState();
    store.optimisticAdd({
      itemId: item.id,
      name: item.name,
      icon: item.icon,
      unitPrice: item.price,
    });
    const res = await postJson<AddItemResult>("/api/bill/add", { itemId: item.id });
    const s = useBillStore.getState();
    if (res.ok) {
      s.confirmAdd(item.id, res.data);
    } else {
      s.failAdd(item.id);
      toast.error(res.error || "Couldn't save that tap.", {
        action: { label: "Retry", onClick: () => addItem(item) },
      });
    }
  }, []);

  const decreaseItem = useCallback(async (itemId: string) => {
    useBillStore.getState().optimisticDecrease(itemId);
    const res = await postJson<DecreaseItemResult>("/api/bill/decrease", { itemId });
    const s = useBillStore.getState();
    if (res.ok) s.confirmDecrease(itemId, res.data);
    else {
      s.failDecrease(itemId);
      toast.error(res.error || "Couldn't update that.");
    }
  }, []);

  const removeEntry = useCallback(async (itemId: string) => {
    const existing = useBillStore.getState().entries[itemId];
    useBillStore.getState().optimisticRemove(itemId);
    const res = await postJson("/api/bill/remove", { itemId });
    if (!res.ok) {
      if (existing) useBillStore.getState().restore(existing);
      toast.error(res.error || "Couldn't remove that.");
    }
  }, []);

  const createItem = useCallback(
    async (input: { name: string; price: number; icon?: string | null }): Promise<ApiResult<CatalogItem>> => {
      const res = await postJson<CatalogItem>("/api/items", input);
      if (!res.ok) toast.error(res.error || "Couldn't create that item.");
      return res;
    },
    [],
  );

  return { addItem, decreaseItem, removeEntry, createItem };
}
