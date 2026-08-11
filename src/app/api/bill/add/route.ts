import { billItemSchema } from "@/lib/validations/billing";
import { addItemToBill, BillingError } from "@/lib/services/billing";
import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";

/**
 * POST /api/bill/add — record one tap of an item.
 *
 * Uses a Route Handler (not a Server Action) because Server Actions are
 * dispatched sequentially by the Next client, which would queue rapid taps.
 * `fetch` calls run concurrently; the server-side atomic upsert makes them
 * safe.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = billItemSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const result = await addItemToBill(session.user.id, parsed.data.itemId);
    return ok(result);
  } catch (error) {
    if (error instanceof BillingError) return fail(error.message, 404);
    return fail("Couldn't save that tap.", 500);
  }
}
