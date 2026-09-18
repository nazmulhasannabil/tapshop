import { updateItemSchema } from "@/lib/validations/item";
import { BillingError, deleteItem, updateItem } from "@/lib/services/billing";
import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/items/[id] — update a catalog item. */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { id } = await context.params;
  const body = await parseJson<unknown>(request);
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const item = await updateItem(session.user.id, id, parsed.data);
    return ok(item);
  } catch (error) {
    if (error instanceof BillingError) {
      return fail(error.message, error.code === "ITEM_NOT_FOUND" ? 404 : 400);
    }
    throw error;
  }
}

/** DELETE /api/items/[id] — soft-delete a catalog item. */
export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { id } = await context.params;

  try {
    await deleteItem(session.user.id, id);
    return ok({ id });
  } catch (error) {
    if (error instanceof BillingError) {
      return fail(error.message, error.code === "ITEM_NOT_FOUND" ? 404 : 400);
    }
    throw error;
  }
}
