import { getJson, unwrap } from "@/lib/api/client";
import type { DebtGroup, DebtSummary } from "@/lib/services/debts";
import type {
  FriendsListKind,
  FriendsListPage,
  FriendTabCounts,
} from "@/lib/services/friends";
import type { StatsData } from "@/lib/services/stats";
import { FRIENDS_PAGE_SIZE, SAVED_BILLS_PAGE_SIZE } from "@/lib/constants";
import { DEBT_STATUS } from "@/lib/social-constants";
import type { Paginated, SavedBill } from "@/types/bill";

export async function fetchDebtSummary(): Promise<DebtSummary> {
  return unwrap(await getJson<DebtSummary>("/api/debts/summary"));
}

export async function fetchDebtGroups(
  status: string = DEBT_STATUS.OPEN,
  friendUserId?: string,
): Promise<DebtGroup[]> {
  const qs = new URLSearchParams({ grouped: "1", status });
  if (friendUserId) qs.set("friendUserId", friendUserId);
  return unwrap(await getJson<DebtGroup[]>(`/api/debts?${qs.toString()}`));
}

export async function fetchFriendsPage(
  list: FriendsListKind,
  cursor?: string | null,
): Promise<FriendsListPage> {
  const qs = new URLSearchParams({
    list,
    limit: String(FRIENDS_PAGE_SIZE),
  });
  if (cursor) qs.set("cursor", cursor);
  return unwrap(await getJson<FriendsListPage>(`/api/friends?${qs.toString()}`));
}

export async function fetchFriendCounts(): Promise<FriendTabCounts> {
  return unwrap(await getJson<FriendTabCounts>("/api/friends?counts=1"));
}

export async function fetchStats(): Promise<StatsData> {
  return unwrap(await getJson<StatsData>("/api/stats"));
}

export async function fetchSavedBills(page = 1): Promise<Paginated<SavedBill>> {
  const qs = new URLSearchParams({
    page: String(page),
    pageSize: String(SAVED_BILLS_PAGE_SIZE),
  });
  return unwrap(await getJson<Paginated<SavedBill>>(`/api/saved-bills?${qs.toString()}`));
}
