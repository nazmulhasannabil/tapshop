import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { billEntries, items } from "@/db/schema";

/**
 * Spending/analytics aggregation for the Stats screen.
 *
 * All figures are derived from {@link billEntries} — one row per
 * (user, item, day). `unit_price`/`subtotal` are snapshots, so historical
 * sums stay correct even if `items.price` changes later.
 */

/** Numeric columns come back as strings from Drizzle; coerce for the client. */
const num = (v: string | number | null | undefined): number =>
  Number(v ?? 0);

/** A single weekday's spending total in the weekly chart. */
export type DayTotal = { label: string; value: number };

export type MostUsed = { name: string; icon: string | null };

/** Serializable payload handed to the `<StatsScreen />` client component. */
export type StatsData = {
  todaySpend: number;
  yesterdaySpend: number;
  weekSpend: number;
  monthSpend: number;
  itemsTapped: number;
  mostUsed: MostUsed | null;
  weekly: DayTotal[];
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Monday 00:00 (local time) of the week containing `now`.
 * Used both to bound the SQL query and to build the 7-day chart skeleton.
 */
function startOfWeek(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // days since Monday (0 = Monday)
  d.setDate(d.getDate() - diff);
  return d;
}

/** Sum `subtotal` for a single day expressed as a SQL date expression. */
async function sumSpendOnDay(
  userId: string,
  dateExpr: SQL,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
    .from(billEntries)
    .where(
      and(eq(billEntries.userId, userId), eq(billEntries.billDate, dateExpr)),
    );
  return num(row?.total);
}

/** Sum `subtotal` from a SQL date expression onward (week / month ranges). */
async function sumSpendFrom(
  userId: string,
  fromDateExpr: SQL,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
    .from(billEntries)
    .where(
      and(
        eq(billEntries.userId, userId),
        sql`${billEntries.billDate} >= ${fromDateExpr}`,
      ),
    );
  return num(row?.total);
}

/** Total item taps (sum of quantity) over the trailing 30 days. */
async function getItemsTapped(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${billEntries.quantity}), 0)` })
    .from(billEntries)
    .where(
      and(
        eq(billEntries.userId, userId),
        sql`${billEntries.consumedAt} >= NOW() - INTERVAL '30 days'`,
      ),
    );
  return num(row?.total);
}

/** The item the user has tapped most over the trailing 30 days. */
export async function getMostUsed(userId: string): Promise<MostUsed | null> {
  const [row] = await db
    .select({ name: items.name, icon: items.icon })
    .from(billEntries)
    .innerJoin(items, eq(billEntries.itemId, items.id))
    .where(
      and(
        eq(billEntries.userId, userId),
        sql`${billEntries.consumedAt} >= NOW() - INTERVAL '30 days'`,
      ),
    )
    .groupBy(items.id, items.name, items.icon)
    .orderBy(desc(sql`sum(${billEntries.quantity})`))
    .limit(1);

  return row ? { name: row.name, icon: row.icon } : null;
}

/** Mon–Sun spending totals for the current week (zeros for days with no spend). */
async function getWeekly(userId: string): Promise<DayTotal[]> {
  const monday = startOfWeek();
  const mondayStr = monday.toISOString().slice(0, 10);

  // Pre-fill the 7-day skeleton so empty days still render in the chart.
  const skeleton = DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { label, key: d.toISOString().slice(0, 10), value: 0 };
  });

  const rows = await db
    .select({
      billDate: billEntries.billDate,
      total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
    })
    .from(billEntries)
    .where(
      and(
        eq(billEntries.userId, userId),
        sql`${billEntries.billDate} >= ${mondayStr}`,
      ),
    )
    .groupBy(billEntries.billDate)
    .orderBy(asc(billEntries.billDate));

  const byKey = new Map(rows.map((r) => [r.billDate, num(r.total)]));
  return skeleton.map((d) => ({ label: d.label, value: byKey.get(d.key) ?? 0 }));
}

/**
 * Gather every figure the Stats screen needs in a single batch of parallel
 * queries against {@link billEntries}.
 */
export async function getStats(userId: string): Promise<StatsData> {
  const [
    todaySpend,
    yesterdaySpend,
    weekSpend,
    monthSpend,
    itemsTapped,
    mostUsed,
    weekly,
  ] = await Promise.all([
    sumSpendOnDay(userId, sql`CURRENT_DATE`),
    sumSpendOnDay(userId, sql`(CURRENT_DATE - INTERVAL '1 day')::date`),
    sumSpendFrom(userId, sql`date_trunc('week', CURRENT_DATE)::date`),
    sumSpendFrom(userId, sql`date_trunc('month', CURRENT_DATE)::date`),
    getItemsTapped(userId),
    getMostUsed(userId),
    getWeekly(userId),
  ]);

  return {
    todaySpend,
    yesterdaySpend,
    weekSpend,
    monthSpend,
    itemsTapped,
    mostUsed,
    weekly,
  };
}
