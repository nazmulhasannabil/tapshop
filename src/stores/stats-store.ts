import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { StatsData } from "@/lib/services/stats";
import { useBillStore, computeTotals } from "@/stores/bill-store";

/**
 * Client stats store.
 *
 * Server stats already include saved bills + the open bill. Live overlays only
 * replace the *open* portion with the bill-store total so optimistic taps
 * update today/week/month without double-counting Activity snapshots:
 *
 *   displayToday = server.todaySpend - server.openTodaySpend + billTotal
 *   displayWeek  = server.weekSpend  - server.openTodaySpend + billTotal
 *   …
 *
 * When the bill store is not hydrated, server figures are shown unchanged.
 */

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function emptyStats(): StatsData {
  return {
    todaySpend: 0,
    yesterdaySpend: 0,
    weekSpend: 0,
    monthSpend: 0,
    openTodaySpend: 0,
    itemsTapped: 0,
    todayTapCount: 0,
    mostUsed: null,
    todayDate: "",
    weekly: DAY_LABELS.map((label) => ({ label, date: "", value: 0 })),
    monthly: [],
  };
}

function deriveStats(
  serverStats: StatsData | null,
  billHydrated: boolean,
  billTotal: number,
  billTapCount: number,
): StatsData {
  if (!serverStats) return emptyStats();
  if (!billHydrated) return serverStats;

  // Swap the open-bill baseline for the live bill-store total.
  const openDelta = billTotal - serverStats.openTodaySpend;
  const tapDelta = billTapCount - serverStats.todayTapCount;

  const todaySpend = Math.max(0, serverStats.todaySpend + openDelta);
  const weekSpend = Math.max(0, serverStats.weekSpend + openDelta);
  const monthSpend = Math.max(0, serverStats.monthSpend + openDelta);
  const itemsTapped = Math.max(0, serverStats.itemsTapped + tapDelta);

  // Key overlays to the server calendar day (same as bill_date / open bill),
  // not the browser weekday — otherwise TZ skew duplicates spend on two bars.
  const today = serverStats.todayDate;
  const weekly = serverStats.weekly.map((d) =>
    d.date === today ? { ...d, value: todaySpend } : d,
  );
  const monthly = serverStats.monthly.map((d) =>
    d.date === today ? { ...d, value: todaySpend } : d,
  );

  return {
    todaySpend,
    yesterdaySpend: serverStats.yesterdaySpend,
    weekSpend,
    monthSpend,
    openTodaySpend: billTotal,
    itemsTapped,
    todayTapCount: billTapCount,
    mostUsed: serverStats.mostUsed,
    todayDate: serverStats.todayDate,
    weekly,
    monthly,
  };
}

function billSnapshot(): {
  hydrated: boolean;
  total: number;
  count: number;
} {
  const bill = useBillStore.getState();
  const { total, count } = computeTotals(bill.entries);
  return { hydrated: bill.hydrated, total, count };
}

type StatsStoreState = {
  serverStats: StatsData | null;
  stats: StatsData;
  hydrate: (serverStats: StatsData) => void;
  refreshFromServer: (serverStats: StatsData) => void;
};

export const useStatsStore = create<StatsStoreState>((set) => ({
  serverStats: null,
  stats: emptyStats(),

  hydrate: (serverStats) =>
    set((state) => {
      if (state.serverStats) return state;
      const { hydrated, total, count } = billSnapshot();
      return {
        serverStats,
        stats: deriveStats(serverStats, hydrated, total, count),
      };
    }),

  refreshFromServer: (serverStats) => {
    const { hydrated, total, count } = billSnapshot();
    set({
      serverStats,
      stats: deriveStats(serverStats, hydrated, total, count),
    });
  },
}));

let prevEntriesRef: Record<string, import("@/stores/bill-store").BillEntry> | undefined;
let prevHydrated = false;

useBillStore.subscribe((billState) => {
  const entriesChanged = billState.entries !== prevEntriesRef;
  const hydratedChanged = billState.hydrated !== prevHydrated;
  if (!entriesChanged && !hydratedChanged) return;
  prevEntriesRef = billState.entries;
  prevHydrated = billState.hydrated;

  const { serverStats } = useStatsStore.getState();
  if (!serverStats) return;
  const { total, count } = computeTotals(billState.entries);
  useStatsStore.setState({
    stats: deriveStats(serverStats, billState.hydrated, total, count),
  });
});

export const useStatsData = (): StatsData =>
  useStatsStore(useShallow((s) => s.stats));
