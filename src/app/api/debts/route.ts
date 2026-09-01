import { getSession } from "@/lib/auth/server";
import { fail, ok, parseJson } from "@/lib/api/http";
import { createDebt, groupDebts, listDebts } from "@/lib/services/debts";
import { createDebtSchema } from "@/lib/validations/debt";
import { DEBT_STATUS } from "@/lib/social-constants";

/** GET /api/debts?status=&friendUserId=&grouped=1 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const friendUserId = searchParams.get("friendUserId") ?? undefined;
  const grouped = searchParams.get("grouped") === "1";

  if (grouped) {
    const groups = await groupDebts(
      session.user.id,
      status ?? DEBT_STATUS.OPEN,
      friendUserId,
    );
    return ok(groups);
  }

  const debts = await listDebts(session.user.id, { status, friendUserId });
  return ok(debts);
}

/** POST /api/debts */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const body = await parseJson<unknown>(request);
  const parsed = createDebtSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  try {
    const debt = await createDebt(session.user.id, session.user.name, parsed.data);
    return ok(debt, 201);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Could not save debt.", 400);
  }
}
