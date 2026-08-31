import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { getFriendsOverview } from "@/lib/services/friends";

/** GET /api/friends — friends + pending incoming/outgoing. */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const data = await getFriendsOverview(session.user.id);
  return ok(data);
}
