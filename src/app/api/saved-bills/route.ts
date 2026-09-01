import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { getSavedBills } from "@/lib/services/saved-bills";
import { SAVED_BILLS_PAGE_SIZE } from "@/lib/constants";

/** GET /api/saved-bills?page=&pageSize= */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { searchParams } = new URL(request.url);
  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("pageSize");
  const page = Number(rawPage) || 1;
  const pageSize = Number(rawPageSize) || SAVED_BILLS_PAGE_SIZE;

  const result = await getSavedBills(session.user.id, page, pageSize);
  return ok(result);
}
