/** Shared types for the admin dashboard. */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "active" | "offline";
  todayBill: number;
  totalItems: number;
  totalSpent: number;
  avgPerTap: number;
  thisMonth: number;
  joinedDate: string;
};

export type AdminTransaction = {
  id: string;
  name: string;
  icon: string;
  date: string;
  amount: number;
  quantity: number;
};

/** Period kind for dashboard / spendings date scope. */
export type DashboardPeriodKind = "today" | "week" | "month" | "date";

export type DashboardPeriodInput = {
  kind: DashboardPeriodKind;
  /** Required when kind is `date` (YYYY-MM-DD). */
  date?: string;
};

/** Resolved inclusive date range in app timezone. */
export type ResolvedPeriod = {
  kind: DashboardPeriodKind;
  startDate: string;
  endDate: string;
  /** Human label for KPIs / headers. */
  label: string;
};

export type PeriodSummary = {
  totalSpend: number;
  activeUsers: number;
};

/** One bar in the period spend chart. */
export type DailyPoint = {
  day: string;
  date: string;
  value: number;
};

/** Per-user spend for a selected period. */
export type PeriodUserSpend = {
  id: string;
  name: string;
  email: string;
  image?: string;
  totalSpend: number;
  tapCount: number;
  percentage: number;
  lastActivityAt: string | null;
};
