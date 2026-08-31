import { requireUser } from "@/lib/auth/server";
import { getTodayBill } from "@/lib/services/billing";
import { getSavedBills, SAVED_BILLS_PAGE_SIZE } from "@/lib/services/saved-bills";
import { getStats } from "@/lib/services/stats";
import { ActivityScreen } from "@/components/activity/activity-screen";
import { StatsProvider } from "@/components/stats/stats-provider";

/**
 * Activity page — spend overview + paginated saved bills.
 * Pagination is URL-driven (`?page=N`).
 */
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireUser();

  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number(rawPage) || 1;

  const [result, stats, todayBill] = await Promise.all([
    getSavedBills(session.user.id, page, SAVED_BILLS_PAGE_SIZE),
    getStats(session.user.id),
    getTodayBill(session.user.id),
  ]);

  return (
    <StatsProvider initialStats={stats} todayBill={todayBill}>
      <ActivityScreen page={result} />
    </StatsProvider>
  );
}
