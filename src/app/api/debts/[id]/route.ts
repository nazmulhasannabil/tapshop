import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";
import { updateDebt } from "@/lib/services/debts";
import { updateDebtSchema } from "@/lib/validations/debt";

/** PATCH /api/debts/[id] — settle / edit. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { id } = await context.params;
  if (!id) return fail("Missing id.", 400);

  const body = await parseJson<unknown>(request);
  const parsed = updateDebtSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const debt = await updateDebt(session.user.id, id, parsed.data);
    return ok(debt);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Update failed.", 400);
  }
}
