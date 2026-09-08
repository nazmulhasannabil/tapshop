import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/api/http";
import { FRIENDS_PAGE_SIZE } from "@/lib/constants";
import {
  clampFriendsPageSize,
  decodeFriendCursor,
  getFriendsListPage,
  getFriendTabCounts,
  type FriendsListKind,
} from "@/lib/services/friends";

function parseList(value: string | null): FriendsListKind | null {
  if (value === "friends" || value === "requests" || value === "suggestions") return value;
  return null;
}

function cursorOk(list: FriendsListKind, cursor: string | null): boolean {
  if (!cursor) return true;
  if (list === "suggestions") {
    const offset = Number.parseInt(cursor, 10);
    return Number.isFinite(offset) && offset >= 0 && String(offset) === cursor;
  }
  return decodeFriendCursor(cursor) != null;
}

/** GET /api/friends?list=&limit=&cursor= or ?counts=1 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) return fail("Unauthorized.", 401);

  const { searchParams } = new URL(request.url);
  if (searchParams.get("counts") === "1") {
    const counts = await getFriendTabCounts(session.user.id);
    return ok(counts);
  }

  const list = parseList(searchParams.get("list"));
  if (!list) return fail("Invalid list.", 400);

  const cursor = searchParams.get("cursor");
  if (!cursorOk(list, cursor)) return fail("Invalid cursor.", 400);

  const limit = clampFriendsPageSize(Number(searchParams.get("limit")) || FRIENDS_PAGE_SIZE);
  const page = await getFriendsListPage(session.user.id, list, cursor, limit);
  return ok(page);
}
