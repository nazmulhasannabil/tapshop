import { cache } from "react";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, billEntries, items, savedBills } from "@/db/schema";
import {
  APP_TIMEZONE,
  ymdInAppTimezone,
} from "@/lib/timezone";
import {
  sqlAppDateTrunc,
  sqlAppToday,
} from "@/lib/timezone-sql";
import type {
  AdminUser,
  AdminTransaction,
  DashboardPeriodInput,
  ResolvedPeriod,
  PeriodSummary,
  DailyPoint,
  PeriodUserSpend,
} from "@/components/admin/types";

/** Numeric columns come back as strings from Drizzle; coerce for the client. */
const num = (v: string | number | null | undefined): number =>
  Number(v ?? 0);

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

type DayAgg = { spend: number; taps: number };
type UserAgg = {
  spend: number;
  taps: number;
  lastAt: string | null;
  name: string;
  email: string;
  image: string | null;
};

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

/** Add `days` to a `YYYY-MM-DD` string in UTC calendar space (no TZ shift). */
function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Monday YYYY-MM-DD of the week containing `ymd` (ISO, matches Postgres week trunc). */
function startOfWeekYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
  const sinceMon = (dow + 6) % 7;
  return addDaysYmd(ymd, -sinceMon);
}

function startOfMonthYmd(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

function daysInMonth(ymd: string): number {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function formatPeriodDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Parse dashboard period from URL search params.
 * Invalid or missing values fall back to `today`.
 */
export function parseDashboardPeriod(params: {
  period?: string | string[];
  date?: string | string[];
}): DashboardPeriodInput {
  const rawPeriod = Array.isArray(params.period)
    ? params.period[0]
    : params.period;
  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;

  if (rawDate && YMD_RE.test(rawDate)) {
    return { kind: "date", date: rawDate };
  }

  if (rawPeriod === "week" || rawPeriod === "month" || rawPeriod === "today") {
    return { kind: rawPeriod };
  }

  return { kind: "today" };
}

/** Resolve a period input to an inclusive app-timezone date range. */
export function resolvePeriod(
  input: DashboardPeriodInput = { kind: "today" },
): ResolvedPeriod {
  const today = ymdInAppTimezone();

  if (input.kind === "date" && input.date && YMD_RE.test(input.date)) {
    return {
      kind: "date",
      startDate: input.date,
      endDate: input.date,
      label: formatPeriodDayLabel(input.date),
    };
  }

  if (input.kind === "week") {
    const start = startOfWeekYmd(today);
    return {
      kind: "week",
      startDate: start,
      endDate: addDaysYmd(start, 6),
      label: "This week",
    };
  }

  if (input.kind === "month") {
    const start = startOfMonthYmd(today);
    const end = addDaysYmd(start, daysInMonth(today) - 1);
    return {
      kind: "month",
      startDate: start,
      endDate: end,
      label: "This month",
    };
  }

  return {
    kind: "today",
    startDate: today,
    endDate: today,
    label: "Today",
  };
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

function laterIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

/**
 * Load open bill_entries + saved_bills day aggregates for a date range,
 * then merge (same truth as user stats — saves must not erase spend).
 */
async function loadCombinedDayMap(
  startDate: string,
  endDate: string,
): Promise<Map<string, DayAgg>> {
  const [openRows, savedRows] = await Promise.all([
    db
      .select({
        billDate: billEntries.billDate,
        total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
        taps: sql<string>`coalesce(sum(${billEntries.quantity}), 0)`,
      })
      .from(billEntries)
      .where(
        and(
          sql`${billEntries.billDate} >= ${startDate}`,
          sql`${billEntries.billDate} <= ${endDate}`,
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
          sql`${savedBills.billDate} >= ${startDate}`,
          sql`${savedBills.billDate} <= ${endDate}`,
        ),
      )
      .groupBy(savedBills.billDate),
  ]);

  const combined = new Map<string, DayAgg>();
  for (const r of openRows) {
    mergeDay(combined, r.billDate, num(r.total), num(r.taps));
  }
  for (const r of savedRows) {
    mergeDay(combined, r.billDate, num(r.total), num(r.taps));
  }
  return combined;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type AdminDashboardData = {
  period: ResolvedPeriod;
  summary: PeriodSummary;
  daily: DailyPoint[];
  /** Preview list (capped) for the home screen. */
  spenders: PeriodUserSpend[];
  /** True when more spenders exist beyond the preview. */
  hasMoreSpenders: boolean;
};

const HOME_SPENDER_PREVIEW = 8;

/**
 * Gather every figure the admin Dashboard needs for a selected period —
 * summary KPIs, daily series, and top spenders — including saved bills.
 */
export async function getAdminDashboard(
  input: DashboardPeriodInput = { kind: "today" },
): Promise<AdminDashboardData> {
  const period = resolvePeriod(input);
  const [dayMap, allSpenders] = await Promise.all([
    loadCombinedDayMap(period.startDate, period.endDate),
    getPeriodUserSpend(period),
  ]);

  let totalSpend = 0;
  for (const agg of dayMap.values()) totalSpend += agg.spend;

  return {
    period,
    summary: {
      totalSpend,
      activeUsers: allSpenders.length,
    },
    daily: buildDailySeries(period, dayMap),
    spenders: allSpenders.slice(0, HOME_SPENDER_PREVIEW),
    hasMoreSpenders: allSpenders.length > HOME_SPENDER_PREVIEW,
  };
}

/** Total spend + distinct active users for a resolved period. */
export async function getPeriodSpendSummary(
  period: ResolvedPeriod,
): Promise<PeriodSummary> {
  const spenders = await getPeriodUserSpend(period);
  return {
    totalSpend: spenders.reduce((sum, u) => sum + u.totalSpend, 0),
    activeUsers: spenders.length,
  };
}

function buildDailySeries(
  period: ResolvedPeriod,
  dayMap: Map<string, DayAgg>,
): DailyPoint[] {
  if (period.kind === "today" || period.kind === "date") {
    return [];
  }

  if (period.kind === "week") {
    return DAY_LABELS.map((label, i) => {
      const date = addDaysYmd(period.startDate, i);
      return { day: label, date, value: dayMap.get(date)?.spend ?? 0 };
    });
  }

  const [ys, ms, ds] = period.startDate.split("-").map(Number);
  const [ye, me, de] = period.endDate.split("-").map(Number);
  const dayCount =
    Math.round(
      (Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000,
    ) + 1;

  return Array.from({ length: dayCount }, (_, i) => {
    const date = addDaysYmd(period.startDate, i);
    const dayNum = String(Number(date.slice(8, 10)));
    return { day: dayNum, date, value: dayMap.get(date)?.spend ?? 0 };
  });
}

/** One bar per day in the period (empty for single-day — UI skips the chart). */
export async function getPeriodDailySeries(
  period: ResolvedPeriod,
): Promise<DailyPoint[]> {
  if (period.kind === "today" || period.kind === "date") {
    return [];
  }
  const dayMap = await loadCombinedDayMap(period.startDate, period.endDate);
  return buildDailySeries(period, dayMap);
}

/**
 * Per-user spend for a period (open lines + saved snapshots), ranked by spend.
 */
export async function getPeriodUserSpend(
  period: ResolvedPeriod,
): Promise<PeriodUserSpend[]> {
  const { startDate, endDate } = period;

  const [openRows, savedRows] = await Promise.all([
    db
      .select({
        userId: billEntries.userId,
        name: users.name,
        email: users.email,
        image: users.image,
        total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
        taps: sql<string>`coalesce(sum(${billEntries.quantity}), 0)`,
        lastAt: sql<string>`max(${billEntries.consumedAt})`,
      })
      .from(billEntries)
      .innerJoin(users, eq(billEntries.userId, users.id))
      .where(
        and(
          sql`${billEntries.billDate} >= ${startDate}`,
          sql`${billEntries.billDate} <= ${endDate}`,
        ),
      )
      .groupBy(billEntries.userId, users.id),
    db
      .select({
        userId: savedBills.userId,
        name: users.name,
        email: users.email,
        image: users.image,
        total: sql<string>`coalesce(sum(${savedBills.total}), 0)`,
        taps: sql<string>`coalesce(sum(${savedBills.itemCount}), 0)`,
        lastAt: sql<string>`max(${savedBills.createdAt})`,
      })
      .from(savedBills)
      .innerJoin(users, eq(savedBills.userId, users.id))
      .where(
        and(
          sql`${savedBills.billDate} >= ${startDate}`,
          sql`${savedBills.billDate} <= ${endDate}`,
        ),
      )
      .groupBy(savedBills.userId, users.id),
  ]);

  const byUser = new Map<string, UserAgg>();

  for (const r of openRows) {
    byUser.set(r.userId, {
      spend: num(r.total),
      taps: num(r.taps),
      lastAt: r.lastAt ? String(r.lastAt) : null,
      name: r.name,
      email: r.email,
      image: r.image,
    });
  }

  for (const r of savedRows) {
    const prev = byUser.get(r.userId);
    if (!prev) {
      byUser.set(r.userId, {
        spend: num(r.total),
        taps: num(r.taps),
        lastAt: r.lastAt ? String(r.lastAt) : null,
        name: r.name,
        email: r.email,
        image: r.image,
      });
      continue;
    }
    prev.spend += num(r.total);
    prev.taps += num(r.taps);
    prev.lastAt = laterIso(prev.lastAt, r.lastAt ? String(r.lastAt) : null);
  }

  const totalSpend = [...byUser.values()].reduce((s, u) => s + u.spend, 0);

  return [...byUser.entries()]
    .map(([id, u]) => ({
      id,
      name: u.name,
      email: u.email,
      image: u.image ?? undefined,
      totalSpend: u.spend,
      tapCount: u.taps,
      percentage:
        totalSpend > 0 ? Math.round((u.spend / totalSpend) * 100) : 0,
      lastActivityAt: u.lastAt,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

export type SpendingsPageData = {
  period: ResolvedPeriod;
  summary: PeriodSummary;
  spenders: PeriodUserSpend[];
};

/** Full spenders list for `/dashboard/spendings`. */
export async function getSpendingsPageData(
  input: DashboardPeriodInput = { kind: "today" },
): Promise<SpendingsPageData> {
  const period = resolvePeriod(input);
  const spenders = await getPeriodUserSpend(period);
  return {
    period,
    summary: {
      totalSpend: spenders.reduce((sum, u) => sum + u.totalSpend, 0),
      activeUsers: spenders.length,
    },
    spenders,
  };
}

// ---------------------------------------------------------------------------
// Users list
// ---------------------------------------------------------------------------

/**
 * Fetch all non-admin users with aggregated spending stats.
 * Uses batch GROUP BY queries for efficiency instead of per-user loops.
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
      isActive: users.isActive,
    })
    .from(users)
    .where(ne(users.role, "admin"))
    .orderBy(asc(users.name));

  if (allUsers.length === 0) return [];

  const [todayRows, totalRows, monthRows] = await Promise.all([
    db.execute(sql`
      select user_id, coalesce(sum(amount), 0) as today_bill
      from (
        select ${billEntries.userId} as user_id, ${billEntries.subtotal} as amount
        from ${billEntries}
        where ${billEntries.billDate} = ${sqlAppToday()}

        union all

        select ${savedBills.userId} as user_id, ${savedBills.total} as amount
        from ${savedBills}
        where ${savedBills.billDate} = ${sqlAppToday()}
      ) t
      group by user_id
    `),

    db.execute(sql`
      select user_id,
             coalesce(sum(amount), 0) as total_spent,
             coalesce(sum(qty), 0) as total_items
      from (
        select ${billEntries.userId} as user_id,
               ${billEntries.subtotal} as amount,
               ${billEntries.quantity} as qty
        from ${billEntries}

        union all

        select ${savedBills.userId} as user_id,
               ${savedBills.total} as amount,
               ${savedBills.itemCount} as qty
        from ${savedBills}
      ) t
      group by user_id
    `),

    db.execute(sql`
      select user_id, coalesce(sum(amount), 0) as month_spend
      from (
        select ${billEntries.userId} as user_id, ${billEntries.subtotal} as amount
        from ${billEntries}
        where ${billEntries.billDate} >= ${sqlAppDateTrunc("month")}

        union all

        select ${savedBills.userId} as user_id, ${savedBills.total} as amount
        from ${savedBills}
        where ${savedBills.billDate} >= ${sqlAppDateTrunc("month")}
      ) t
      group by user_id
    `),
  ]);

  type AggRow = Record<string, unknown>;
  const todayList = (todayRows as unknown as { rows: AggRow[] }).rows;
  const totalList = (totalRows as unknown as { rows: AggRow[] }).rows;
  const monthList = (monthRows as unknown as { rows: AggRow[] }).rows;

  const todayMap = new Map(
    todayList.map((r) => [String(r.user_id), num(r.today_bill as string)]),
  );
  const totalMap = new Map(
    totalList.map((r) => [
      String(r.user_id),
      {
        spent: num(r.total_spent as string),
        items: num(r.total_items as string),
      },
    ]),
  );
  const monthMap = new Map(
    monthList.map((r) => [String(r.user_id), num(r.month_spend as string)]),
  );

  return allUsers.map((u) => {
    const total = totalMap.get(u.id) ?? { spent: 0, items: 0 };
    const todayBill = todayMap.get(u.id) ?? 0;
    const thisMonth = monthMap.get(u.id) ?? 0;
    const avgPerTap = total.items > 0 ? total.spent / total.items : 0;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.image ?? undefined,
      status: userStatus(u.lastActiveAt, todayBill),
      todayBill,
      totalItems: total.items,
      totalSpent: total.spent,
      avgPerTap: Math.round(avgPerTap * 100) / 100,
      thisMonth,
      joinedDate: formatDate(u.createdAt),
    };
  });
}

// ---------------------------------------------------------------------------
// User details
// ---------------------------------------------------------------------------

export type AdminUserDetails = {
  user: AdminUser;
  transactions: AdminTransaction[];
};

/**
 * Fetch a single user's profile + spending stats + recent transactions.
 * Cached per-request so `generateMetadata` and the page share one load.
 */
export const getAdminUserDetails = cache(async function getAdminUserDetails(
  userId: string,
): Promise<AdminUserDetails | null> {
  const [userRow] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      lastActiveAt: users.lastActiveAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) return null;

  const [todayRows, totalRows, monthRows, txRows] = await Promise.all([
    db.execute(sql`
      select coalesce(sum(amount), 0) as total
      from (
        select ${billEntries.subtotal} as amount
        from ${billEntries}
        where ${billEntries.userId} = ${userId}
          and ${billEntries.billDate} = ${sqlAppToday()}

        union all

        select ${savedBills.total} as amount
        from ${savedBills}
        where ${savedBills.userId} = ${userId}
          and ${savedBills.billDate} = ${sqlAppToday()}
      ) t
    `),

    db.execute(sql`
      select coalesce(sum(amount), 0) as total_spent,
             coalesce(sum(qty), 0) as total_items
      from (
        select ${billEntries.subtotal} as amount, ${billEntries.quantity} as qty
        from ${billEntries}
        where ${billEntries.userId} = ${userId}

        union all

        select ${savedBills.total} as amount, ${savedBills.itemCount} as qty
        from ${savedBills}
        where ${savedBills.userId} = ${userId}
      ) t
    `),

    db.execute(sql`
      select coalesce(sum(amount), 0) as total
      from (
        select ${billEntries.subtotal} as amount
        from ${billEntries}
        where ${billEntries.userId} = ${userId}
          and ${billEntries.billDate} >= ${sqlAppDateTrunc("month")}

        union all

        select ${savedBills.total} as amount
        from ${savedBills}
        where ${savedBills.userId} = ${userId}
          and ${savedBills.billDate} >= ${sqlAppDateTrunc("month")}
      ) t
    `),

    db
      .select({
        id: billEntries.id,
        name: items.name,
        icon: items.icon,
        subtotal: billEntries.subtotal,
        quantity: billEntries.quantity,
        consumedAt: billEntries.consumedAt,
      })
      .from(billEntries)
      .innerJoin(items, eq(billEntries.itemId, items.id))
      .where(eq(billEntries.userId, userId))
      .orderBy(desc(billEntries.consumedAt))
      .limit(20),
  ]);

  const todayList = (todayRows as unknown as { rows: { total: string }[] }).rows;
  const totalList = (
    totalRows as unknown as {
      rows: { total_spent: string; total_items: string }[];
    }
  ).rows;
  const monthList = (monthRows as unknown as { rows: { total: string }[] }).rows;

  const todayBill = num(todayList[0]?.total);
  const total = totalList[0]
    ? {
        spent: num(totalList[0].total_spent),
        items: num(totalList[0].total_items),
      }
    : { spent: 0, items: 0 };
  const thisMonth = num(monthList[0]?.total);
  const avgPerTap = total.items > 0 ? total.spent / total.items : 0;

  const user: AdminUser = {
    id: userRow.id,
    name: userRow.name,
    email: userRow.email,
    avatar: userRow.image ?? undefined,
    status: userStatus(userRow.lastActiveAt, todayBill),
    todayBill,
    totalItems: total.items,
    totalSpent: total.spent,
    avgPerTap: Math.round(avgPerTap * 100) / 100,
    thisMonth,
    joinedDate: formatDate(userRow.createdAt),
  };

  const transactions: AdminTransaction[] = txRows.map((tx) => ({
    id: tx.id,
    name: tx.name,
    icon: tx.icon ?? "🏷️",
    date: formatDate(tx.consumedAt),
    amount: num(tx.subtotal),
    quantity: tx.quantity,
  }));

  return { user, transactions };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine active/offline status based on last activity. */
function userStatus(
  lastActiveAt: Date | null,
  todayBill: number,
): "active" | "offline" {
  if (todayBill > 0) return "active";
  if (lastActiveAt) {
    const hours = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60);
    if (hours < 24) return "active";
  }
  return "offline";
}

/** Format a date as "Mon 5, Aug 2026" for display. */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

