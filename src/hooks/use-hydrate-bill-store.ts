"use client";

import { useEffect } from "react";
import type { BillLine } from "@/types/bill";
import { useBillStore } from "@/stores/bill-store";

/** Hydrate the optimistic bill store once from server props. */
export function useHydrateBillStore(todayBill: BillLine[]) {
  const hydrate = useBillStore((s) => s.hydrate);

  useEffect(() => {
    hydrate(todayBill);
  }, [hydrate, todayBill]);
}
