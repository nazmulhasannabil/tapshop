import { cache } from "react";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { billEntries, items, savedBills } from "@/db/schema";
import { sqlAppTodayMinus } from "@/lib/timezone-sql";
import { ymdInAppTimezone } from "@/lib/timezone";

/**
 * Spending/analytics for the Stats screen.
 *
 * Spend is the sum of:
 *   1. Open lines in {@link billEntries} (today's unsaved bill)
 *   2. Finalized snapshots in {@link savedBills} (Activity history)
 *
 * Saving a bill moves rows from (1) → (2). Stats must count both, or
 * week/month totals shrink every time the user hits Save.
 *
 * Hot path: three SQL round-trips (open series, saved series, most-used),
 * with all card totals / charts derived in JS from those series. Avoids the
 * previous ~20-query fan-out that serialized on a single pg connection.
 */

const num = (v: string | number | null | undefined): number => Number(v ?? 0);

/** One weekday bar (`date` is YYYY-MM-DD; `label` is Mon–Sun). */
export type DayTotal = { label: string; date: string; value: number };
/** One calendar day in the monthly spend heatmap (`date` is YYYY-MM-DD). */
export type MonthDayTotal = { date: string; value: number };
export type MostUsed = { name: string; icon: string | null };

export type StatsData = {
  todaySpend: number;
  yesterdaySpend: number;
  weekSpend: number;
  monthSpend: number;
  /**
   * Open (unsaved) bill spend for today only — baseline for live bill-store
   * overlays. Full `todaySpend` = saved-today + this value.
   */
  openTodaySpend: number;
  itemsTapped: number;
  /** Open-bill tap count today — baseline for live tap deltas. */
  todayTapCount: number;
  mostUsed: MostUsed | null;
  /**
   * App-timezone calendar today (`YYYY-MM-DD`). Client live overlays key off
   * this so they stay aligned with bill_date buckets.
   */
  todayDate: string;
  weekly: DayTotal[];
  /** Per-day spend for past 11 months through next month (zero-filled). */
  monthly: MonthDayTotal[];
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type DayAgg = { spend: number; taps: number };

/** Add `days` to a `YYYY-MM-DD` string in UTC calendar space (no TZ shift). */
function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Monday YYYY-MM-DD of the current week (ISO), matching Postgres `date_trunc('week')`. */
function startOfWeekYmd(todayYmd: string): string {
  const [y, m, d] = todayYmd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
  const sinceMon = (dow + 6) % 7;
  return addDaysYmd(todayYmd, -sinceMon);
}

/** First day of the calendar month containing `ymd`. */
function startOfMonthYmd(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

/** Add calendar months to a YYYY-MM-DD (day clamped via UTC Date). */
function addMonthsYmd(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Past 11 months through next month (same window as the previous SQL bounds). */
function monthRangeBounds(todayYmd: string): {
  start: string;
  endExclusive: string;
  dayCount: number;
} {
  const monthStart = startOfMonthYmd(todayYmd);
  const start = addMonthsYmd(monthStart, -11);
  const endExclusive = addMonthsYmd(monthStart, 2);
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = endExclusive.split("-").map(Number);
  const dayCount = Math.round(
    (Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000,
  );
  return { start, endExclusive, dayCount };
}

function mergeDay(
  map: Map<string, DayAgg>,
  billDate: string,
  spend: number,
  taps: number,
) {
  const prev = map.get(billDate) ?? { spend: 0, taps: 0 };
  map.set(billDate, {
    spend: prev.spend + spend,
    taps: prev.taps + taps,
  });
}

function sumSpendFrom(
  map: Map<string, DayAgg>,
  fromInclusive: string,
  endExclusive?: string,
): number {
  let total = 0;
  for (const [date, agg] of map) {
    if (date < fromInclusive) continue;
    if (endExclusive && date >= endExclusive) continue;
    total += agg.spend;
  }
  return total;
}

function sumTapsFrom(
  map: Map<string, DayAgg>,
  fromInclusive: string,
  endExclusive?: string,
): number {
  let total = 0;
  for (const [date, agg] of map) {
    if (date < fromInclusive) continue;
    if (endExclusive && date >= endExclusive) continue;
    total += agg.taps;
  }
  return total;
}

/**
 * Most-tapped item over 30 days across open lines and saved bill JSON snapshots.
 */
export async function getMostUsed(userId: string): Promise<MostUsed | null> {
  const since30 = sqlAppTodayMinus("30 days");
  // Union open bill_entries with unnested saved_bills.items, then pick the top.
  const rows = await db.execute(
    sql`
      select name, icon, sum(qty)::int as qty
      from (
        select ${items.name} as name, ${items.icon} as icon, ${billEntries.quantity} as qty
        from ${billEntries}
        inner join ${items} on ${items.id} = ${billEntries.itemId}
        where ${billEntries.userId} = ${userId}
          and ${billEntries.billDate} >= ${since30}

        union all

        select elem->>'name' as name,
               elem->>'icon' as icon,
               coalesce((elem->>'quantity')::int, 0) as qty
        from ${savedBills}
        cross join lateral jsonb_array_elements(${savedBills.items}) as elem
        where ${savedBills.userId} = ${userId}
          and ${savedBills.billDate} >= ${since30}
      ) t
      group by name, icon
      order by sum(qty) desc
      limit 1
    `,
  );

  const list = (rows as unknown as { rows: Record<string, unknown>[] }).rows;
  const top = list[0];
  if (!top || typeof top.name !== "string") return null;
  return {
    name: top.name,
    icon: typeof top.icon === "string" ? top.icon : null,
  };
}

/**
 * Every figure the Stats screen needs. Open-bill fields are kept separate so
 * the client can overlay optimistic taps without double-counting saved spend.
 */
export const getStats = cache(async function getStats(userId: string): Promise<StatsData> {
  const todayDate = ymdInAppTimezone();
  const yesterday = addDaysYmd(todayDate, -1);
  const weekStart = startOfWeekYmd(todayDate);
  const monthStart = startOfMonthYmd(todayDate);
  const since30 = addDaysYmd(todayDate, -30);
  const { start, endExclusive, dayCount } = monthRangeBounds(todayDate);

  const [openRows, savedRows, mostUsed] = await Promise.all([
    db
      .select({
        billDate: billEntries.billDate,
        total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
        taps: sql<string>`coalesce(sum(${billEntries.quantity}), 0)`,
      })
      .from(billEntries)
      .where(
        and(
          eq(billEntries.userId, userId),
          sql`${billEntries.billDate} >= ${start}`,
          sql`${billEntries.billDate} < ${endExclusive}`,
        ),
      )
      .groupBy(billEntries.billDate),
    db
      .select({
        billDate: savedBills.billDate,
        total: sql<string>`coalesce(sum(${savedBills.total}), 0)`,
        taps: sql<string>`coalesce(sum(${savedBills.itemCount}), 0)`,
      })
      .from(savedBills)
      .where(
        and(
          eq(savedBills.userId, userId),
          sql`${savedBills.billDate} >= ${start}`,
          sql`${savedBills.billDate} < ${endExclusive}`,
        ),
      )
      .groupBy(savedBills.billDate),
    getMostUsed(userId),
  ]);

  const openByDay = new Map<string, DayAgg>();
  for (const r of openRows) {
    mergeDay(openByDay, r.billDate, num(r.total), num(r.taps));
  }

  const savedByDay = new Map<string, DayAgg>();
  for (const r of savedRows) {
    mergeDay(savedByDay, r.billDate, num(r.total), num(r.taps));
  }

  const combined = new Map<string, DayAgg>();
  for (const [date, agg] of openByDay) {
    mergeDay(combined, date, agg.spend, agg.taps);
  }
  for (const [date, agg] of savedByDay) {
    mergeDay(combined, date, agg.spend, agg.taps);
  }

  const openToday = openByDay.get(todayDate) ?? { spend: 0, taps: 0 };

  const weekly: DayTotal[] = DAY_LABELS.map((label, i) => {
    const date = addDaysYmd(weekStart, i);
    return {
      label,
      date,
      value: combined.get(date)?.spend ?? 0,
    };
  });

  const monthly: MonthDayTotal[] = Array.from({ length: dayCount }, (_, i) => {
    const date = addDaysYmd(start, i);
    return { date, value: combined.get(date)?.spend ?? 0 };
  });

  return {
    todaySpend: combined.get(todayDate)?.spend ?? 0,
    yesterdaySpend: combined.get(yesterday)?.spend ?? 0,
    weekSpend: sumSpendFrom(combined, weekStart),
    monthSpend: sumSpendFrom(combined, monthStart),
    openTodaySpend: openToday.spend,
    itemsTapped: sumTapsFrom(combined, since30),
    todayTapCount: openToday.taps,
    mostUsed,
    todayDate,
    weekly,
    monthly,
  };
});
