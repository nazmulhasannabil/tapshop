/** Centralized TanStack Query key factory for user-scoped data. */
export const queryKeys = {
  todayBill: (userId: string) => ["todayBill", userId] as const,
  stats: (userId: string) => ["stats", userId] as const,
  debts: {
    summary: (userId: string) => ["debts", "summary", userId] as const,
    groups: (userId: string, status: string, friendId?: string) =>
      ["debts", "groups", userId, status, friendId ?? "all"] as const,
  },
  friends: (userId: string) => ["friends", userId] as const,
  friendsList: (userId: string, list: string) =>
    ["friends", userId, "list", list] as const,
  friendsCounts: (userId: string) => ["friends", userId, "counts"] as const,
  profile: (userId: string) => ["profile", userId] as const,
  savedBills: (userId: string, page: number) => ["savedBills", userId, page] as const,
  catalog: () => ["catalog", "active"] as const,
};
