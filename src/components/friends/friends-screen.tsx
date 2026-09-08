"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InviteFriendSheet } from "@/components/friends/invite-friend-sheet";
import {
  useAcceptFriend,
  useDeclineFriend,
  useFriends,
  useRemoveFriend,
  useRequestFriend,
} from "@/hooks/queries/use-friends";
import { formatCurrency } from "@/lib/constants";
import { queryKeys } from "@/lib/query/keys";
import type {
  FriendsOverview,
  FriendshipListItem,
  SuggestedFriend,
} from "@/lib/services/friends";
import { cn } from "@/lib/utils";

function dismissKey(userId: string) {
  return `tapshop:pymk-dismissed:${userId}`;
}

function readDismissed(userId: string): string[] {
  try {
    const raw = localStorage.getItem(dismissKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function mutualLine(item: SuggestedFriend) {
  if (item.mutualCount <= 1) {
    const name = item.mutualNames[0];
    return name ? `Friends with ${name}` : "1 mutual friend";
  }
  return `${item.mutualCount} mutual friends`;
}

export function FriendsScreen({
  userId,
  initial,
  highlightFriendshipId,
}: {
  userId: string;
  initial: FriendsOverview;
  highlightFriendshipId?: string | null;
}) {
  const queryClient = useQueryClient();
  const { data = initial } = useFriends(userId, initial);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const acceptMutation = useAcceptFriend(userId);
  const declineMutation = useDeclineFriend(userId);
  const removeMutation = useRemoveFriend(userId);
  const requestMutation = useRequestFriend(userId);

  useEffect(() => {
    setDismissed(readDismissed(userId));
  }, [userId]);

  const busyId =
    acceptMutation.isPending
      ? acceptMutation.variables
      : declineMutation.isPending
        ? declineMutation.variables
        : removeMutation.isPending
          ? removeMutation.variables
          : null;

  const suggestions = (data.suggestions ?? []).filter(
    (item) => !dismissed.includes(item.user.id),
  );

  async function accept(friendshipId: string) {
    try {
      await acceptMutation.mutateAsync(friendshipId);
      toast.success("You're friends now");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept request.");
    }
  }

  async function decline(friendshipId: string) {
    try {
      await declineMutation.mutateAsync(friendshipId);
      toast.message("Request declined");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not decline request.");
    }
  }

  async function cancelOutgoing(friendshipId: string) {
    try {
      await declineMutation.mutateAsync(friendshipId);
      toast.message("Request cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel request.");
    }
  }

  function confirmRemove(item: FriendshipListItem) {
    toast(`Remove ${item.user.name}?`, {
      description: "They will no longer appear in your friends list.",
      action: {
        label: "Remove",
        onClick: () => void removeFriend(item.friendshipId),
      },
    });
  }

  async function removeFriend(friendshipId: string) {
    try {
      await removeMutation.mutateAsync(friendshipId);
      toast.success("Friend removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove friend.");
    }
  }

  async function addSuggested(item: SuggestedFriend) {
    try {
      const result = await requestMutation.mutateAsync(item.user.id);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send request.");
    }
  }

  function dismissSuggestion(targetUserId: string) {
    setDismissed((prev) => {
      if (prev.includes(targetUserId)) return prev;
      const next = [...prev, targetUserId];
      localStorage.setItem(dismissKey(userId), JSON.stringify(next));
      return next;
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-5 pb-[calc(var(--bottom-nav-h)+1.5rem)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Friends</h2>
          <p className="text-sm text-muted-foreground">
            People you know, and people they know.
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" />
          Invite
        </Button>
      </div>

      {data.pendingIncoming.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-0.5">
            <h3 className="text-base font-bold text-foreground">Friend requests</h3>
            <span className="text-sm font-semibold text-primary">
              {data.pendingIncoming.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.pendingIncoming.map((item) => (
                <li
                  key={item.friendshipId}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5",
                    item.friendshipId === highlightFriendshipId && "bg-primary/5",
                  )}
                >
                  <Avatar initial={item.user.name} image={item.user.image} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{item.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Wants to be friends
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={busyId === item.friendshipId}
                        onClick={() => void accept(item.friendshipId)}
                      >
                        {busyId === item.friendshipId ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={busyId === item.friendshipId}
                        onClick={() => void decline(item.friendshipId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-0.5 text-base font-bold text-foreground">People you may know</h3>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory">
            {suggestions.map((item) => (
              <SuggestionCard
                key={item.user.id}
                item={item}
                busy={requestMutation.isPending && requestMutation.variables === item.user.id}
                onAdd={() => void addSuggested(item)}
                onRemove={() => dismissSuggestion(item.user.id)}
              />
            ))}
          </div>
        </section>
      )}

      {data.pendingOutgoing.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-0.5 text-base font-bold text-foreground">Sent</h3>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.pendingOutgoing.map((item) => (
                <li
                  key={item.friendshipId}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <Avatar initial={item.user.name} image={item.user.image} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {item.user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Request sent
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.friendshipId}
                    onClick={() => void cancelOutgoing(item.friendshipId)}
                  >
                    {busyId === item.friendshipId ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="px-0.5 text-base font-bold text-foreground">
          Your friends
          {data.friends.length > 0 && (
            <span className="ml-1.5 font-medium text-muted-foreground">
              · {data.friends.length}
            </span>
          )}
        </h3>
        {data.friends.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-10 text-center shadow-sm ring-1 ring-foreground/5">
            <Users className="size-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">No friends yet</p>
            <p className="text-sm text-muted-foreground">
              Invite someone to track shared money together.
            </p>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" />
              Add friend
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.friends.map((item) => (
                <li
                  key={item.friendshipId}
                  className="flex items-center gap-2 px-4 py-3.5"
                >
                  <Link
                    href={`/debts?friend=${encodeURIComponent(item.user.id)}`}
                    className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
                  >
                    <Avatar initial={item.user.name} image={item.user.image} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        {item.user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.user.email}
                      </p>
                    </div>
                    <BalanceBadge net={item.netBalance} />
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={busyId === item.friendshipId}
                    onClick={() => confirmRemove(item)}
                    aria-label={`Remove ${item.user.name}`}
                  >
                    {busyId === item.friendshipId ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserMinus className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <InviteFriendSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.friends(userId) });
        }}
      />
    </main>
  );
}

function SuggestionCard({
  item,
  busy,
  onAdd,
  onRemove,
}: {
  item: SuggestedFriend;
  busy: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
      <div className="flex h-28 items-center justify-center bg-primary/10">
        <Avatar initial={item.user.name} image={item.user.image} size="xl" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{mutualLine(item)}</p>
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <Button size="sm" className="w-full" disabled={busy} onClick={onAdd}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Add friend"}
          </Button>
          <Button size="sm" variant="outline" className="w-full" disabled={busy} onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}

function Avatar({
  initial,
  image,
  size = "md",
}: {
  initial: string;
  image: string | null;
  size?: "md" | "lg" | "xl";
}) {
  const letter = initial.charAt(0).toUpperCase() || "?";
  const sizeClass =
    size === "xl" ? "size-16 text-xl" : size === "lg" ? "size-12 text-base" : "size-10 text-sm";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-foreground/10", sizeClass)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary",
        sizeClass,
      )}
    >
      {letter}
    </span>
  );
}

function BalanceBadge({ net }: { net: number }) {
  if (Math.abs(net) < 0.005) {
    return (
      <span className="text-xs font-medium text-muted-foreground">Settled</span>
    );
  }
  const owed = net > 0;
  return (
    <span
      className={cn(
        "text-xs font-semibold tnum",
        owed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400",
      )}
    >
      {owed ? "+" : "−"}
      {formatCurrency(Math.abs(net))}
    </span>
  );
}
