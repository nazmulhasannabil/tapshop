import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { getDebtSummary } from "@/lib/services/debts";

/** GET /api/debts/summary */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const summary = await getDebtSummary(session.user.id);
  return ok(summary);
}
