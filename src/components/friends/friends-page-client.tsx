"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { FriendsScreen } from "@/components/friends/friends-screen";
import type { FriendsOverview } from "@/lib/services/friends";
import type { ApiResult } from "@/types/bill";

/**
 * Claims an invite token once after login/register, then shows Friends.
 */
export function FriendsPageClient({
  initial,
  inviteToken,
  highlightFriendshipId,
}: {
  initial: FriendsOverview;
  inviteToken?: string | null;
  highlightFriendshipId?: string | null;
}) {
  const router = useRouter();
  const claimed = useRef(false);

  useEffect(() => {
    if (!inviteToken || claimed.current) return;
    claimed.current = true;

    (async () => {
      const res = await fetch("/api/friends/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken }),
      });
      const json = (await res.json()) as ApiResult<{
        friendshipId: string;
        inviterName: string;
      }>;
      if (!json.ok) {
        toast.error(json.error);
        router.replace("/friends");
        return;
      }
      toast.success(`${json.data.inviterName} sent you a friend request`);
      router.replace(`/friends?request=${encodeURIComponent(json.data.friendshipId)}`);
      router.refresh();
    })();
  }, [inviteToken, router]);

  return (
    <FriendsScreen
      initial={initial}
      highlightFriendshipId={highlightFriendshipId}
    />
  );
}
