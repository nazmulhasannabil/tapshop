"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { FriendsScreen } from "@/components/friends/friends-screen";
import { postJson, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { FriendsOverview } from "@/lib/services/friends";

/**
 * Claims an invite token once after login/register, then shows Friends.
 */
export function FriendsPageClient({
  userId,
  initial,
  inviteToken,
  highlightFriendshipId,
}: {
  userId: string;
  initial: FriendsOverview;
  inviteToken?: string | null;
  highlightFriendshipId?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const claimed = useRef(false);

  useEffect(() => {
    if (!inviteToken || claimed.current) return;
    claimed.current = true;

    (async () => {
      try {
        const data = unwrap(
          await postJson<{ friendshipId: string; inviterName: string }>(
            "/api/friends/claim",
            { token: inviteToken },
          ),
        );
        toast.success(`${data.inviterName} sent you a friend request`);
        void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
        router.replace(`/friends?request=${encodeURIComponent(data.friendshipId)}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not claim invite.");
        router.replace("/friends");
      }
    })();
  }, [inviteToken, queryClient, router, userId]);

  return (
    <FriendsScreen
      userId={userId}
      initial={initial}
      highlightFriendshipId={highlightFriendshipId}
    />
  );
}
