"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InviteFriendSheet } from "@/components/friends/invite-friend-sheet";
import {
  useAcceptFriend,
  useDeclineFriend,
  useFriends,
  useRemoveFriend,
} from "@/hooks/queries/use-friends";
import { formatCurrency } from "@/lib/constants";
import { queryKeys } from "@/lib/query/keys";
import type { FriendsOverview, FriendshipListItem } from "@/lib/services/friends";
import { cn } from "@/lib/utils";

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

  const acceptMutation = useAcceptFriend(userId);
  const declineMutation = useDeclineFriend(userId);
  const removeMutation = useRemoveFriend(userId);

  const busyId =
    acceptMutation.isPending
      ? acceptMutation.variables
      : declineMutation.isPending
        ? declineMutation.variables
        : removeMutation.isPending
          ? removeMutation.variables
          : null;

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

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-5 pb-[calc(var(--bottom-nav-h)+1.5rem)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Friends</h2>
          <p className="text-sm text-muted-foreground">
            Sync debts with people you trust.
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" />
          Invite
        </Button>
      </div>

      {data.pendingIncoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Friend requests
          </h3>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.pendingIncoming.map((item) => (
                <PendingRow
                  key={item.friendshipId}
                  item={item}
                  highlight={item.friendshipId === highlightFriendshipId}
                  busy={busyId === item.friendshipId}
                  onAccept={() => void accept(item.friendshipId)}
                  onDecline={() => void decline(item.friendshipId)}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {data.pendingOutgoing.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sent
          </h3>
          <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.pendingOutgoing.map((item) => (
                <li
                  key={item.friendshipId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Avatar initial={item.user.name} image={item.user.image} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {item.user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Pending · {item.user.email}
                    </p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={busyId === item.friendshipId}
                    onClick={() => void cancelOutgoing(item.friendshipId)}
                    aria-label="Cancel request"
                  >
                    {busyId === item.friendshipId ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your friends
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
                  className="flex items-center gap-2 px-4 py-3"
                >
                  <Link
                    href={`/debts?friend=${encodeURIComponent(item.user.id)}`}
                    className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
                  >
                    <Avatar initial={item.user.name} image={item.user.image} />
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

function PendingRow({
  item,
  highlight,
  busy,
  onAccept,
  onDecline,
}: {
  item: FriendshipListItem;
  highlight?: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        highlight && "bg-primary/5",
      )}
    >
      <Avatar initial={item.user.name} image={item.user.image} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{item.user.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          Wants to be friends
        </p>
      </div>
      <div className="flex gap-1.5">
        <Button
          size="icon-sm"
          variant="outline"
          disabled={busy}
          onClick={onDecline}
          aria-label="Decline"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
        </Button>
        <Button size="icon-sm" disabled={busy} onClick={onAccept} aria-label="Accept">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        </Button>
      </div>
    </li>
  );
}

function Avatar({ initial, image }: { initial: string; image: string | null }) {
  const letter = initial.charAt(0).toUpperCase() || "?";
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
      />
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
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
