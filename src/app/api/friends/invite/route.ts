import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";
import { inviteFriend } from "@/lib/services/friends";
import { inviteFriendSchema } from "@/lib/validations/friend";

/** POST /api/friends/invite — email invite or pending friendship for existing users. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = inviteFriendSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const result = await inviteFriend(
      session.user.id,
      session.user.name,
      parsed.data.email,
    );
    return ok(result, 201);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Invite failed.", 400);
  }
}
