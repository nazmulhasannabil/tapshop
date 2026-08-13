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

export type AdminStats = {
  totalUsers: number;
  totalUsersGrowth: string; // e.g. "+3 this week"
  todaySpend: number;
  monthSpend: number;
  activeToday: number;
};

export type RecentActivity = {
  id: string;
  type: "purchase" | "admin" | "user_join";
  title: string;
  subtitle: string;
  amount?: string;
};

export type WeeklyData = {
  day: string;
  value: number;
}[];

/** Per-user today spend breakdown for the Today's Spend drill-down. */
export type TodayUserSpend = {
  id: string;
  name: string;
  email: string;
  image?: string;
  totalToday: number;
  tapCount: number;
  lastTapAt: string; // ISO string
};

/** Per-user month revenue breakdown for the Month Revenue drill-down. */
export type MonthUserSpend = {
  id: string;
  name: string;
  email: string;
  image?: string;
  totalMonth: number;
  tapCount: number;
  percentage: number;
};

/** User active today for the Active Today drill-down. */
export type ActiveTodayUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
  todaySpend: number;
  lastActiveAt: string; // ISO string
};
