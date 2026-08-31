import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";
import { claimInvite } from "@/lib/services/friends";
import { claimInviteSchema } from "@/lib/validations/friend";

/** POST /api/friends/claim — attach invite token to a pending friendship after auth. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = claimInviteSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const result = await claimInvite(
      session.user.id,
      session.user.email,
      parsed.data.token,
    );
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Claim failed.", 400);
  }
}
