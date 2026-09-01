import { requireUser } from "@/lib/auth/server";
import { getSavedBills } from "@/lib/services/saved-bills";
import { SAVED_BILLS_PAGE_SIZE } from "@/lib/constants";
import { SavedBillsTableSection } from "@/components/activity/saved-bills-table-section";

export async function SavedBillsSection({
  page,
}: {
  page: number;
}) {
  const session = await requireUser();
  const result = await getSavedBills(session.user.id, page, SAVED_BILLS_PAGE_SIZE);

  return <SavedBillsTableSection page={result} />;
}
