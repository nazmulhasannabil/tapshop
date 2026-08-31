import { fail, ok } from "@/lib/api/http";
import { getInvitePreview } from "@/lib/services/friends";

/** GET /api/friends/invite/[token] — public invite preview for register/login. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) return fail("Missing token.", 400);

  const preview = await getInvitePreview(token);
  if (!preview) return fail("Invite not found.", 404);
  return ok(preview);
}
