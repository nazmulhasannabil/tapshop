import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";
import { requestFriendship } from "@/lib/services/friends";
import { requestFriendSchema } from "@/lib/validations/friend";

/** POST /api/friends/request — add a friend of a friend only. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = requestFriendSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const result = await requestFriendship(session.user.id, parsed.data.userId);
    return ok(result, 201);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Request failed.", 400);
  }
}
