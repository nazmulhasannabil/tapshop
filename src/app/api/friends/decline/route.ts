import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";
import { declineFriendship } from "@/lib/services/friends";
import { friendshipIdSchema } from "@/lib/validations/friend";

/** POST /api/friends/decline */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = friendshipIdSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const result = await declineFriendship(session.user.id, parsed.data.friendshipId);
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Decline failed.", 400);
  }
}
