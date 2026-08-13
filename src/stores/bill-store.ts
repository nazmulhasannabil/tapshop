import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { BillLine } from "@/types/bill";

/**
 * Client bill store — UI state only, NOT the database.
 *
 * Each entry tracks:
 *   - `confirmed`: the last authoritative quantity from the server
 *   - `pending`:   the optimistic delta (in-flight taps; can dip negative
 *                  briefly during decreases)
 *
 * Displayed quantity = max(0, confirmed + pending). This keeps rapid taps
 * responsive and correct even when server responses arrive out of order:
 * on every confirm we set `confirmed = max(confirmed, serverQty)`, so the
 * final value always matches the server's atomic total.
 */
export type BillEntry = {
  itemId: string;
  name: string;
  icon: string | null;
  unitPrice: number;
  confirmed: number;
  pending: number;
};

export const displayedQty = (e: BillEntry | undefined): number =>
  e ? Math.max(0, e.confirmed + e.pending) : 0;

export type BillTotals = { count: number; total: number };

export function computeTotals(entries: Record<string, BillEntry>): BillTotals {
  let count = 0;
  let total = 0;
  for (const e of Object.values(entries)) {
    const qty = displayedQty(e);
    if (qty <= 0) continue;
    count += qty;
    total += qty * e.unitPrice;
  }
  return { count, total };
}

export function billLines(entries: Record<string, BillEntry>): BillEntry[] {
  return Object.values(entries)
    .filter((e) => displayedQty(e) > 0)
    .sort((a, b) => displayedQty(b) - displayedQty(a));
}

type AddPayload = {
  itemId: string;
  name: string;
  icon: string | null;
  unitPrice: number;
};

type BillStoreState = {
  entries: Record<string, BillEntry>;
  hydrated: boolean;
  hydrate: (lines: BillLine[]) => void;
  optimisticAdd: (item: AddPayload) => void;
  confirmAdd: (itemId: string, auth: { quantity: number; unitPrice: number }) => void;
  failAdd: (itemId: string) => void;
  optimisticDecrease: (itemId: string) => void;
  confirmDecrease: (itemId: string, auth: { quantity: number }) => void;
  failDecrease: (itemId: string) => void;
  optimisticRemove: (itemId: string) => void;
  restore: (entry: BillEntry) => void;
  reset: () => void;
  /** Empty the current bill but stay hydrated (state still matches server). */
  clear: () => void;
};

/** Prune an entry that has no confirmed quantity and no in-flight taps. */
function prune(entries: Record<string, BillEntry>, itemId: string): Record<string, BillEntry> {
  const e = entries[itemId];
  if (!e) return entries;
  if (e.confirmed === 0 && e.pending === 0) {
    const next = { ...entries };
    delete next[itemId];
    return next;
  }
  return entries;
}

export const useBillStore = create<BillStoreState>((set) => ({
  entries: {},
  hydrated: false,

  hydrate: (lines) =>
    set({
      hydrated: true,
      entries: Object.fromEntries(
        lines
          .filter((l) => l.quantity > 0)
          .map((l) => [
            l.itemId,
            {
              itemId: l.itemId,
              name: l.name,
              icon: l.icon,
              unitPrice: l.unitPrice,
              confirmed: l.quantity,
              pending: 0,
            },
          ]),
      ),
    }),

  optimisticAdd: (item) =>
    set((state) => {
      const existing = state.entries[item.itemId];
      if (existing) {
        return {
          entries: {
            ...state.entries,
            [item.itemId]: { ...existing, pending: existing.pending + 1 },
          },
        };
      }
      return {
        entries: {
          ...state.entries,
          [item.itemId]: { ...item, confirmed: 0, pending: 1 },
        },
      };
    }),

  confirmAdd: (itemId, _auth) =>
    set((state) => {
      const e = state.entries[itemId];
      if (!e) return state;
      // Each confirmation accounts for exactly one +1 tap, so we increment by
      // one (not max(confirmed, serverQty)) — server responses can arrive out
      // of order, and `confirmed + pending` must stay invariant through the
      // round trip. The authoritative truth re-loads via hydrate on next visit.
      const next: BillEntry = {
        ...e,
        pending: Math.max(0, e.pending - 1),
        confirmed: e.confirmed + 1,
      };
      const entries = prune({ ...state.entries, [itemId]: next }, itemId);
      return { entries };
    }),

  failAdd: (itemId) =>
    set((state) => {
      const e = state.entries[itemId];
      if (!e) return state;
      const entries = prune(
        { ...state.entries, [itemId]: { ...e, pending: Math.max(0, e.pending - 1) } },
        itemId,
      );
      return { entries };
    }),

  optimisticDecrease: (itemId) =>
    set((state) => {
      const e = state.entries[itemId];
      if (!e || e.confirmed + e.pending <= 0) return state;
      return {
        entries: { ...state.entries, [itemId]: { ...e, pending: e.pending - 1 } },
      };
    }),

  confirmDecrease: (itemId, auth) =>
    set((state) => {
      const e = state.entries[itemId];
      if (!e) return state;
      const next: BillEntry = {
        ...e,
        pending: e.pending + 1,
        confirmed: Math.max(0, auth.quantity),
      };
      const entries = prune({ ...state.entries, [itemId]: next }, itemId);
      return { entries };
    }),

  failDecrease: (itemId) =>
    set((state) => {
      const e = state.entries[itemId];
      if (!e) return state;
      const entries = prune({ ...state.entries, [itemId]: { ...e, pending: e.pending + 1 } }, itemId);
      return { entries };
    }),

  optimisticRemove: (itemId) =>
    set((state) => {
      const entries = { ...state.entries };
      delete entries[itemId];
      return { entries };
    }),

  restore: (entry) =>
    set((state) => ({ entries: { ...state.entries, [entry.itemId]: entry } })),

  reset: () => set({ entries: {}, hydrated: false }),

  // Used after a successful "Save Bill": the server clears today's bill, so we
  // mirror that here. Stays `hydrated` because the empty state is authoritative.
  clear: () => set({ entries: {} }),
}));

/* ------------------------------- Selectors -------------------------------- */

export const useBillEntry = (itemId: string) => useBillStore((s) => s.entries[itemId]);

export const useBillTotals = (): BillTotals =>
  useBillStore(useShallow((s) => computeTotals(s.entries)));

export const useBillLineList = (): BillEntry[] =>
  useBillStore(useShallow((s) => billLines(s.entries)));

export const useBillHydrated = () => useBillStore((s) => s.hydrated);
