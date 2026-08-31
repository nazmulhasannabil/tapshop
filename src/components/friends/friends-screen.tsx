"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InviteFriendSheet } from "@/components/friends/invite-friend-sheet";
import { formatCurrency } from "@/lib/constants";
import type { FriendsOverview, FriendshipListItem } from "@/lib/services/friends";
import type { ApiResult } from "@/types/bill";
import { cn } from "@/lib/utils";

export function FriendsScreen({
  initial,
  highlightFriendshipId,
}: {
  initial: FriendsOverview;
  highlightFriendshipId?: string | null;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<FriendsOverview | null>(null);
  const data = local ?? initial;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/friends");
    const json = (await res.json()) as ApiResult<FriendsOverview>;
    if (json.ok) setLocal(json.data);
    router.refresh();
  }, [router]);

  async function accept(friendshipId: string) {
    setBusyId(friendshipId);
    try {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.success("You're friends now");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function decline(friendshipId: string) {
    setBusyId(friendshipId);
    try {
      const res = await fetch("/api/friends/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.message("Request declined");
      await refresh();
    } finally {
      setBusyId(null);
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
          <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.pendingIncoming.map((item) => (
                <PendingRow
                  key={item.friendshipId}
                  item={item}
                  highlight={item.friendshipId === highlightFriendshipId}
                  busy={busyId === item.friendshipId}
                  onAccept={() => accept(item.friendshipId)}
                  onDecline={() => decline(item.friendshipId)}
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
          <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
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
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-10 text-center shadow-sm ring-1 ring-foreground/5">
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
          <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
            <ul className="divide-y divide-border">
              {data.friends.map((item) => (
                <li key={item.friendshipId}>
                  <Link
                    href={`/debts?friend=${encodeURIComponent(item.user.id)}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/40"
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
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <InviteFriendSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={refresh}
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
