import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, billEntries, items, activityLogs } from "@/db/schema";
import { formatRelativeTime } from "@/lib/constants";
import type {
  AdminStats,
  AdminUser,
  AdminTransaction,
  RecentActivity,
  WeeklyData,
  TodayUserSpend,
  MonthUserSpend,
  ActiveTodayUser,
} from "@/components/admin/types";

/** Numeric columns come back as strings from Drizzle; coerce for the client. */
const num = (v: string | number | null | undefined): number =>
  Number(v ?? 0);

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Actions that represent a user purchase. */
const PURCHASE_ACTIONS = [
  "user_added_item",
  "user_added_quantity",
] as const;

/** Actions that represent an admin action. */
const ADMIN_ACTIONS = [
  "admin_corrected_entry",
  "admin_deleted_entry",
  "admin_changed_item",
] as const;

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type AdminDashboardData = {
  stats: AdminStats;
  weekly: WeeklyData;
  activity: RecentActivity[];
};

/**
 * Gather every figure the admin Dashboard screen needs — summary stats,
 * weekly consumption chart, and recent activity feed — in a single parallel
 * batch of queries.
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const [stats, weekly, activity] = await Promise.all([
    getAdminStats(),
    getAdminWeekly(),
    getRecentActivity(),
  ]);
  return { stats, weekly, activity };
}

async function getAdminStats(): Promise<AdminStats> {
  const [
    totalRows,
    newThisWeekRows,
    todaySpendRows,
    monthSpendRows,
    activeRows,
  ] = await Promise.all([
    // Total non-admin users
    db
      .select({ value: count() })
      .from(users)
      .where(ne(users.role, "admin")),

    // New users this week (for growth badge)
    db
      .select({ value: count() })
      .from(users)
      .where(
        and(
          ne(users.role, "admin"),
          sql`${users.createdAt} >= date_trunc('week', CURRENT_DATE)`,
        ),
      ),

    // Total spend today (all users)
    db
      .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
      .from(billEntries)
      .where(eq(billEntries.billDate, sql`CURRENT_DATE`)),

    // Total spend this month (all users)
    db
      .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
      .from(billEntries)
      .where(
        sql`${billEntries.billDate} >= date_trunc('month', CURRENT_DATE)::date`,
      ),

    // Distinct active users today
    db
      .select({ value: sql<string>`count(distinct ${billEntries.userId})` })
      .from(billEntries)
      .where(eq(billEntries.billDate, sql`CURRENT_DATE`)),
  ]);

  const totalUsers = num(totalRows[0]?.value);
  const newThisWeek = num(newThisWeekRows[0]?.value);
  const growth =
    newThisWeek > 0
      ? `+${newThisWeek} this week`
      : "No new this week";

  return {
    totalUsers,
    totalUsersGrowth: growth,
    todaySpend: num(todaySpendRows[0]?.total),
    monthSpend: num(monthSpendRows[0]?.total),
    activeToday: num(activeRows[0]?.value),
  };
}

/** Mon–Sun spending totals for the current week (zeros for empty days). */
async function getAdminWeekly(): Promise<WeeklyData> {
  const monday = startOfWeek();
  const mondayStr = monday.toISOString().slice(0, 10);

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
    .where(sql`${billEntries.billDate} >= ${mondayStr}`)
    .groupBy(billEntries.billDate)
    .orderBy(asc(billEntries.billDate));

  const byKey = new Map(rows.map((r) => [r.billDate, num(r.total)]));
  return skeleton.map((d) => ({ day: d.label, value: byKey.get(d.key) ?? 0 }));
}

/** Recent activity feed — combines activity logs + new user registrations. */
async function getRecentActivity(): Promise<RecentActivity[]> {
  // 1. Recent activity logs (last 7 days)
  const logRows = await db
    .select({
      id: activityLogs.id,
      actorName: users.name,
      action: activityLogs.action,
      newValue: activityLogs.newValue,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.actorId, users.id))
    .where(
      sql`${activityLogs.createdAt} >= NOW() - INTERVAL '7 days'`,
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(10);

  // 2. Recent new users (last 7 days, exclude admins)
  const newUsers = await db
    .select({
      id: users.id,
      name: users.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        ne(users.role, "admin"),
        sql`${users.createdAt} >= NOW() - INTERVAL '7 days'`,
      ),
    )
    .orderBy(desc(users.createdAt))
    .limit(5);

  // Map activity logs
  const logActivity: RecentActivity[] = logRows.map((row) => {
    const isPurchase = PURCHASE_ACTIONS.includes(
      row.action as (typeof PURCHASE_ACTIONS)[number],
    );
    const isAdmin = ADMIN_ACTIONS.includes(
      row.action as (typeof ADMIN_ACTIONS)[number],
    );

    const type: RecentActivity["type"] = isPurchase
      ? "purchase"
      : isAdmin
        ? "admin"
        : "purchase";

    // Build human-readable title from action + new value
    const title = formatActionTitle(row.action, row.newValue as Record<string, unknown> | null, row.actorName);

    return {
      id: row.id,
      type,
      title,
      subtitle: formatRelativeTime(row.createdAt),
    };
  });

  // Map new users as "user_join" activities
  const userActivity: RecentActivity[] = newUsers.map((u) => ({
    id: `join-${u.id}`,
    type: "user_join" as const,
    title: `${u.name} joined TapShop`,
    subtitle: formatRelativeTime(u.createdAt),
  }));

  // Merge, sort by most recent, take top 10
  const all = [...logActivity, ...userActivity].slice(0, 10);
  return all;
}

/** Build a human-readable title from an activity log action. */
function formatActionTitle(
  action: string,
  newValue: Record<string, unknown> | null,
  actorName: string,
): string {
  const itemName =
    newValue && typeof newValue === "object" && "name" in newValue
      ? String(newValue.name)
      : null;

  switch (action) {
    case "user_added_item":
      return itemName ? `${actorName} purchased ${itemName}` : `${actorName} made a purchase`;
    case "user_added_quantity":
      return itemName ? `${actorName} added ${itemName}` : `${actorName} tapped an item`;
    case "user_decreased_quantity":
      return itemName ? `${actorName} decreased ${itemName}` : `${actorName} decreased an item`;
    case "user_removed_entry":
      return `${actorName} removed an entry`;
    case "user_created_item":
      return itemName ? `${actorName} created ${itemName}` : `${actorName} created a new item`;
    case "admin_corrected_entry":
      return `${actorName} corrected an entry`;
    case "admin_deleted_entry":
      return `${actorName} deleted an entry`;
    case "admin_changed_item":
      return itemName ? `${actorName} updated ${itemName}` : `${actorName} updated an item`;
    default:
      return `${actorName} performed an action`;
  }
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

  // Batch aggregations grouped by userId
  const [
    todayRows,
    totalRows,
    monthRows,
  ] = await Promise.all([
    // Today's spend per user
    db
      .select({
        userId: billEntries.userId,
        todayBill: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
      })
      .from(billEntries)
      .where(eq(billEntries.billDate, sql`CURRENT_DATE`))
      .groupBy(billEntries.userId),

    // Lifetime totals per user
    db
      .select({
        userId: billEntries.userId,
        totalSpent: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
        totalItems: sql<string>`coalesce(sum(${billEntries.quantity}), 0)`,
      })
      .from(billEntries)
      .groupBy(billEntries.userId),

    // This month per user
    db
      .select({
        userId: billEntries.userId,
        monthSpend: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
      })
      .from(billEntries)
      .where(
        sql`${billEntries.billDate} >= date_trunc('month', CURRENT_DATE)::date`,
      )
      .groupBy(billEntries.userId),
  ]);

  const todayMap = new Map(todayRows.map((r) => [r.userId, num(r.todayBill)]));
  const totalMap = new Map(
    totalRows.map((r) => [r.userId, { spent: num(r.totalSpent), items: num(r.totalItems) }]),
  );
  const monthMap = new Map(monthRows.map((r) => [r.userId, num(r.monthSpend)]));

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
 */
export async function getAdminUserDetails(
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

  const [
    todayRows,
    totalRows,
    monthRows,
    txRows,
  ] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
      .from(billEntries)
      .where(
        and(eq(billEntries.userId, userId), eq(billEntries.billDate, sql`CURRENT_DATE`)),
      ),

    db
      .select({
        totalSpent: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
        totalItems: sql<string>`coalesce(sum(${billEntries.quantity}), 0)`,
      })
      .from(billEntries)
      .where(eq(billEntries.userId, userId)),

    db
      .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
      .from(billEntries)
      .where(
        and(
          eq(billEntries.userId, userId),
          sql`${billEntries.billDate} >= date_trunc('month', CURRENT_DATE)::date`,
        ),
      ),

    // Recent transactions (last 20 entries, joined with items)
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

  const todayBill = num(todayRows[0]?.total);
  const total = totalRows[0]
    ? { spent: num(totalRows[0].totalSpent), items: num(totalRows[0].totalItems) }
    : { spent: 0, items: 0 };
  const thisMonth = num(monthRows[0]?.total);
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
}

// ---------------------------------------------------------------------------
// Dashboard drill-downs
// ---------------------------------------------------------------------------

export type TodayBreakdownData = {
  total: number;
  users: TodayUserSpend[];
};

/**
 * Per-user today spend breakdown with tap count and last tap time.
 * Used by the "Today's Spend" drill-down page.
 */
export async function getTodayBreakdown(): Promise<TodayBreakdownData> {
  const rows = await db
    .select({
      userId: billEntries.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      totalToday: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
      tapCount: sql<string>`count(*)`,
      lastTapAt: sql<string>`max(${billEntries.consumedAt})`,
    })
    .from(billEntries)
    .innerJoin(users, eq(billEntries.userId, users.id))
    .where(eq(billEntries.billDate, sql`CURRENT_DATE`))
    .groupBy(billEntries.userId, users.id)
    .orderBy(desc(sql`sum(${billEntries.subtotal})`));

  const total = rows.reduce((sum, r) => sum + num(r.totalToday), 0);

  return {
    total,
    users: rows.map((r) => ({
      id: r.userId,
      name: r.name,
      email: r.email,
      image: r.image ?? undefined,
      totalToday: num(r.totalToday),
      tapCount: num(r.tapCount),
      lastTapAt: String(r.lastTapAt),
    })),
  };
}

export type MonthBreakdownData = {
  total: number;
  users: MonthUserSpend[];
};

/**
 * Per-user month revenue breakdown with tap count and percentage.
 * Used by the "Month Revenue" drill-down page.
 */
export async function getMonthBreakdown(): Promise<MonthBreakdownData> {
  const rows = await db
    .select({
      userId: billEntries.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      totalMonth: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
      tapCount: sql<string>`count(*)`,
    })
    .from(billEntries)
    .innerJoin(users, eq(billEntries.userId, users.id))
    .where(
      sql`${billEntries.billDate} >= date_trunc('month', CURRENT_DATE)::date`,
    )
    .groupBy(billEntries.userId, users.id)
    .orderBy(desc(sql`sum(${billEntries.subtotal})`));

  const total = rows.reduce((sum, r) => sum + num(r.totalMonth), 0);

  return {
    total,
    users: rows.map((r) => ({
      id: r.userId,
      name: r.name,
      email: r.email,
      image: r.image ?? undefined,
      totalMonth: num(r.totalMonth),
      tapCount: num(r.tapCount),
      percentage: total > 0 ? Math.round((num(r.totalMonth) / total) * 100) : 0,
    })),
  };
}

/**
 * Users active today with their today spend and last activity time.
 * Used by the "Active Today" drill-down page.
 */
export async function getActiveTodayUsers(): Promise<ActiveTodayUser[]> {
  const rows = await db
    .select({
      userId: billEntries.userId,
      name: users.name,
      email: users.email,
      image: users.image,
      todaySpend: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)`,
      lastActiveAt: sql<string>`max(${billEntries.consumedAt})`,
    })
    .from(billEntries)
    .innerJoin(users, eq(billEntries.userId, users.id))
    .where(eq(billEntries.billDate, sql`CURRENT_DATE`))
    .groupBy(billEntries.userId, users.id)
    .orderBy(desc(sql`sum(${billEntries.subtotal})`));

  return rows.map((r) => ({
    id: r.userId,
    name: r.name,
    email: r.email,
    image: r.image ?? undefined,
    todaySpend: num(r.todaySpend),
    lastActiveAt: String(r.lastActiveAt),
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Monday 00:00 (local time) of the current week. */
function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7; // days since Monday (0 = Monday)
  d.setDate(d.getDate() - diff);
  return d;
}

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
