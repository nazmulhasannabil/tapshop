"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteJson, postJson, unwrap } from "@/lib/api/client";
import { fetchFriendCounts, fetchFriendsPage } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { FriendsListKind, FriendsListPage, FriendTabCounts } from "@/lib/services/friends";

export function useFriendCounts(userId: string, initialData?: FriendTabCounts) {
  return useQuery({
    queryKey: queryKeys.friendsCounts(userId),
    queryFn: fetchFriendCounts,
    initialData,
  });
}

export function useFriendsList(
  userId: string,
  list: FriendsListKind,
  initialPage?: FriendsListPage,
) {
  const seeded = initialPage?.list === list ? initialPage : undefined;
  return useInfiniteQuery({
    queryKey: queryKeys.friendsList(userId, list),
    queryFn: ({ pageParam }) => fetchFriendsPage(list, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    initialData: seeded
      ? { pages: [seeded], pageParams: [null] }
      : undefined,
  });
}

export function useRequestFriend(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (targetUserId: string) =>
      unwrap(
        await postJson<{ friendshipId: string; message: string }>(
          "/api/friends/request",
          { userId: targetUserId },
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
    },
  });
}

export function useAcceptFriend(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) =>
      unwrap(
        await postJson("/api/friends/accept", { friendshipId }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
      void queryClient.invalidateQueries({ queryKey: ["debts", "summary", userId] });
    },
  });
}

export function useDeclineFriend(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) =>
      unwrap(
        await postJson("/api/friends/decline", { friendshipId }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
    },
  });
}

export function useRemoveFriend(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendshipId: string) =>
      unwrap(await deleteJson(`/api/friends/${encodeURIComponent(friendshipId)}`)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
      void queryClient.invalidateQueries({ queryKey: ["debts", "summary", userId] });
      void queryClient.invalidateQueries({ queryKey: ["debts", "groups", userId] });
    },
  });
}
