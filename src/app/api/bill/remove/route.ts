import { billItemSchema } from "@/lib/validations/billing";
import { removeBillEntry } from "@/lib/services/billing";
import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";

/** POST /api/bill/remove — delete today's line for an item. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = billItemSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  await removeBillEntry(session.user.id, parsed.data.itemId);
  return ok({ itemId: parsed.data.itemId });
}
