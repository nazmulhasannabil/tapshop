"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteJson, postJson, unwrap } from "@/lib/api/client";
import { fetchFriends } from "@/lib/query/fetchers";
import { queryKeys } from "@/lib/query/keys";
import type { FriendsOverview } from "@/lib/services/friends";

export function useFriends(userId: string, initialData?: FriendsOverview) {
  return useQuery({
    queryKey: queryKeys.friends(userId),
    queryFn: fetchFriends,
    initialData,
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

export function prefetchFriends(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
) {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.friends(userId),
    queryFn: fetchFriends,
  });
}
