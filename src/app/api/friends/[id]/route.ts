import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { removeFriendship } from "@/lib/services/friends";

/** DELETE /api/friends/[id] — unfriend / cancel. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { id } = await context.params;
  if (!id) return fail("Missing id.", 400);

  try {
    const result = await removeFriendship(session.user.id, id);
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Remove failed.", 400);
  }
}
