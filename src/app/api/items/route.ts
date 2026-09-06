import { createItemSchema } from "@/lib/validations/item";
import { BillingError, createItem } from "@/lib/services/billing";
import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";

/** POST /api/items — create a new item (from the "+ Add Item" sheet). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const item = await createItem(session.user.id, parsed.data);
    return ok(item, 201);
  } catch (error) {
    if (error instanceof BillingError) return fail(error.message, 400);
    throw error;
  }
}
