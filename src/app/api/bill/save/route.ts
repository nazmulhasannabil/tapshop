import { saveTodayBill } from "@/lib/services/saved-bills";
import { BillingError } from "@/lib/services/billing";
import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";

/**
 * POST /api/bill/save — freeze today's bill into a `saved_bills` snapshot.
 *
 * No body: the snapshot is derived server-side from today's `bill_entries`
 * (source of truth), so it can't be tampered with and stays consistent with
 * in-flight optimistic taps. The live bill is not modified.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  // No body is expected, but drain it so the underlying connection can be reused.
  await request.text().catch(() => {});

  try {
    const result = await saveTodayBill(session.user.id);
    return ok(result);
  } catch (error) {
    if (error instanceof BillingError && error.code === "EMPTY_BILL") {
      return fail(error.message, 400);
    }
    return fail("Couldn't save that bill.", 500);
  }
}
