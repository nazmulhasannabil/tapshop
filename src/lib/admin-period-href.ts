import type { DashboardPeriodKind } from "@/components/admin/types";

/** Build spendings URL query for a period. */
export function spendingsHref(kind: DashboardPeriodKind, date?: string): string {
  if (kind === "date" && date) {
    return `/dashboard/spendings?period=date&date=${encodeURIComponent(date)}`;
  }
  return `/dashboard/spendings?period=${kind}`;
}

/** Build dashboard home URL query for a period. */
export function dashboardHref(kind: DashboardPeriodKind, date?: string): string {
  if (kind === "date" && date) {
    return `/dashboard?period=date&date=${encodeURIComponent(date)}`;
  }
  return `/dashboard?period=${kind}`;
}
