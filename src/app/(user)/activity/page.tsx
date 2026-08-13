import { requireUser } from "@/lib/auth/server";
import { getSavedBills, SAVED_BILLS_PAGE_SIZE } from "@/lib/services/saved-bills";
import { ActivityScreen } from "@/components/activity/activity-screen";

/**
 * The Activity page — a paginated table of the user's saved bills.
 *
 * Pagination is URL-driven (`?page=N`). `searchParams` is an async Promise in
 * Next 16, so we await it; a missing/non-numeric page falls back to 1.
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

  const result = await getSavedBills(session.user.id, page, SAVED_BILLS_PAGE_SIZE);

  return <ActivityScreen page={result} />;
}
