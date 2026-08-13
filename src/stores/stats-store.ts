import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { StatsData } from "@/lib/services/stats";
import { useBillStore, computeTotals } from "@/stores/bill-store";

/**
 * Client stats store — derives live figures from the bill store.
 *
 * Server-fetched stats provide the baseline. Every time the bill store
 * changes (optimistic add / confirm / fail), we re-derive:
 *   - todaySpend   ← bill store computeTotals().total
 *   - weekSpend   ← serverWeek + todayDelta
 *   - monthSpend  ← serverMonth + todayDelta
 *   - itemsTapped ← serverItems + tapCountDelta
 *   - weekly[todayIndex] ← live today total
 *
 * yesterdaySpend and mostUsed are untouched by today's taps.
 */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Get 0-based index for today in the Mon–Sun week. */
function todayWeekIndex(): number {
  const d = new Date().getDay(); // 0=Sun … 6=Sat
  return (d + 6) % 7; // 0=Mon … 6=Sun
}

function deriveStats(
  serverStats: StatsData | null,
  billTotal: number,
  billTapCount: number,
): StatsData {
  // Empty fallback when the store hasn't been hydrated yet.
  if (!serverStats) {
    return {
      todaySpend: 0,
      yesterdaySpend: 0,
      weekSpend: 0,
      monthSpend: 0,
      itemsTapped: 0,
      mostUsed: null,
      weekly: DAY_LABELS.map((label) => ({ label, value: 0 })),
    };
  }

  const todayDelta = billTotal - serverStats.todaySpend;
  const tapDelta = billTapCount - serverStats.itemsTapped;

  const weekSpend = Math.max(0, serverStats.weekSpend + todayDelta);
  const monthSpend = Math.max(0, serverStats.monthSpend + todayDelta);
  const itemsTapped = Math.max(0, serverStats.itemsTapped + tapDelta);

  // Update today's bar in the weekly chart
  const dayIdx = todayWeekIndex();
  const weekly = serverStats.weekly.map((d, i) =>
    i === dayIdx ? { ...d, value: billTotal } : d,
  );

  return {
    todaySpend: billTotal,
    yesterdaySpend: serverStats.yesterdaySpend,
    weekSpend,
    monthSpend,
    itemsTapped,
    mostUsed: serverStats.mostUsed,
    weekly,
  };
}

type StatsStoreState = {
  /** The last server-fetched baseline. Used to compute deltas. */
  serverStats: StatsData | null;
  /** The reactive stats that the UI reads. */
  stats: StatsData;

  hydrate: (serverStats: StatsData) => void;
  /** Replace the server baseline (e.g. on page revisit or periodic refresh). */
  refreshFromServer: (serverStats: StatsData) => void;
};

export const useStatsStore = create<StatsStoreState>((set, get) => ({
  serverStats: null,
  stats: {
    todaySpend: 0,
    yesterdaySpend: 0,
    weekSpend: 0,
    monthSpend: 0,
    itemsTapped: 0,
    mostUsed: null,
    weekly: DAY_LABELS.map((label) => ({ label, value: 0 })),
  },

  hydrate: (serverStats) =>
    set((state) => {
      // Already hydrated with same data — skip to avoid re-deriving.
      if (state.serverStats) return state;
      const { total, count } = computeTotals(useBillStore.getState().entries);
      return {
        serverStats,
        stats: deriveStats(serverStats, total, count),
      };
    }),

  refreshFromServer: (serverStats) => {
    const { total, count } = computeTotals(useBillStore.getState().entries);
    set({ serverStats, stats: deriveStats(serverStats, total, count) });
  },
}));

/* ---------- Cross-store subscription ---------- */

/**
 * Subscribe to the bill store so stats re-derive automatically on every
 * optimistic change (add, confirm, fail, decrease, remove, clear).
 *
 * Zustand's `subscribe` listener fires on every state change, but we only
 * re-derive when the entries object reference actually changes (rapid taps
 * all produce new objects).
 */
let prevEntriesRef: Record<string, import("@/stores/bill-store").BillEntry> | undefined;

useBillStore.subscribe((billState) => {
  if (billState.entries === prevEntriesRef) return;
  prevEntriesRef = billState.entries;

  const { serverStats } = useStatsStore.getState();
  if (!serverStats) return;
  const { total, count } = computeTotals(billState.entries);
  useStatsStore.setState({ stats: deriveStats(serverStats, total, count) });
});

/* ---------- Selectors ---------- */

/** The full reactive StatsData object. */
export const useStatsData = (): StatsData =>
  useStatsStore(useShallow((s) => s.stats));
