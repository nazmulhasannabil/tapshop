import { billItemSchema } from "@/lib/validations/billing";
import { decreaseItemFromBill } from "@/lib/services/billing";
import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";

/** POST /api/bill/decrease — subtract one from an item on today's bill. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = billItemSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  const result = await decreaseItemFromBill(session.user.id, parsed.data.itemId);
  return ok(result);
}
