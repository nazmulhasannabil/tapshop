import { Suspense } from "react";
import { requireUser } from "@/lib/auth/server";
import { getTodayBill } from "@/lib/services/billing";
import { getStats } from "@/lib/services/stats";
import { ActivityScreen } from "@/components/activity/activity-screen";
import { SavedBillsSection } from "@/components/activity/saved-bills-section";
import { SavedBillsSkeleton } from "@/components/activity/saved-bills-skeleton";
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

  const [stats, todayBill] = await Promise.all([
    getStats(session.user.id),
    getTodayBill(session.user.id),
  ]);

  return (
    <StatsProvider
      userId={session.user.id}
      initialStats={stats}
      todayBill={todayBill}
    >
      <ActivityScreen>
        <Suspense fallback={<SavedBillsSkeleton />}>
          <SavedBillsSection page={page} />
        </Suspense>
      </ActivityScreen>
    </StatsProvider>
  );
}
