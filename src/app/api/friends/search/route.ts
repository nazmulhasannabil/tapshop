import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { searchFriends } from "@/lib/services/friends";

/** GET /api/friends/search?q= — autocomplete accepted friends only. */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const friends = await searchFriends(session.user.id, q);
  return ok(friends);
}
