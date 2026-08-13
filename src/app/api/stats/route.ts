import { getSession } from "@/lib/auth/server";
import { getStats } from "@/lib/services/stats";
import { fail, ok } from "@/lib/api/http";

/**
 * GET /api/stats — fresh stats payload for the client store.
 *
 * Used by the StatsProvider to periodically refresh server baselines
 * (mostUsed, itemsTapped, etc.) so the derived live stats stay accurate.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const stats = await getStats(session.user.id);
  return ok(stats);
}
