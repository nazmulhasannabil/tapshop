"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MoreHorizontal, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InviteFriendSheet } from "@/components/friends/invite-friend-sheet";
import {
  useAcceptFriend,
  useDeclineFriend,
  useFriendCounts,
  useFriendsList,
  useRemoveFriend,
  useRequestFriend,
} from "@/hooks/queries/use-friends";
import { formatCurrency } from "@/lib/constants";
import { queryKeys } from "@/lib/query/keys";
import type {
  FriendsListKind,
  FriendsListPage,
  FriendshipListItem,
  SuggestedFriend,
} from "@/lib/services/friends";
import { cn } from "@/lib/utils";

const TABS: { id: FriendsListKind; label: string }[] = [
  { id: "friends", label: "All friends" },
  { id: "requests", label: "Requests" },
  { id: "suggestions", label: "People you may know" },
];

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

function scrollTabIntoView(container: HTMLDivElement | null, button: HTMLButtonElement | null) {
  if (!container || !button) return;

  const containerRect = container.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const leftOverflow = buttonRect.left - containerRect.left;
  const rightOverflow = buttonRect.right - containerRect.right;

  if (leftOverflow < 0) {
    container.scrollBy({ left: leftOverflow, behavior: "smooth" });
  } else if (rightOverflow > 0) {
    container.scrollBy({ left: rightOverflow, behavior: "smooth" });
  }
}

function mutualLine(item: SuggestedFriend) {
  if (item.mutualCount <= 1) {
    const name = item.mutualNames[0];
    return name ? `Friends with ${name}` : "1 mutual friend";
  }
  return `${item.mutualCount} mutual friends`;
}

function isSuggestion(item: FriendshipListItem | SuggestedFriend): item is SuggestedFriend {
  return "mutualCount" in item;
}

export function FriendsScreen({
  userId,
  initialList,
  initialPage,
  highlightFriendshipId,
}: {
  userId: string;
  initialList: FriendsListKind;
  initialPage: FriendsListPage;
  highlightFriendshipId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FriendsListKind>(initialList);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tabScrollerRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<FriendsListKind, HTMLButtonElement>>>({});

  const countsQuery = useFriendCounts(userId, initialPage.counts);
  const listQuery = useFriendsList(userId, tab, initialPage);
  const acceptMutation = useAcceptFriend(userId);
  const declineMutation = useDeclineFriend(userId);
  const removeMutation = useRemoveFriend(userId);
  const requestMutation = useRequestFriend(userId);

  useEffect(() => {
    setDismissed(readDismissed(userId));
  }, [userId]);

  useEffect(() => {
    if (highlightFriendshipId) setTab("requests");
  }, [highlightFriendshipId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollTabIntoView(tabScrollerRef.current, tabButtonRefs.current[tab] ?? null);
    });
    return () => cancelAnimationFrame(frame);
  }, [tab]);

  const counts = listQuery.data?.pages[0]?.counts ?? countsQuery.data;
  const rawItems = listQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const items =
    tab === "suggestions"
      ? rawItems.filter((item) => isSuggestion(item) && !dismissed.includes(item.user.id))
      : rawItems;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = listQuery;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, tab, items.length]);

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

  function tabCount(id: FriendsListKind) {
    if (!counts) return null;
    if (id === "friends") return counts.friends;
    if (id === "requests") return counts.requests;
    return counts.suggestions;
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 bg-white px-4 py-5 pb-[calc(var(--bottom-nav-h)+1.5rem)]">
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

      <div className="sticky top-0 z-10 -mx-4 bg-white/95 px-4 py-2 backdrop-blur">
        <div ref={tabScrollerRef} className="no-scrollbar flex gap-2 overflow-x-auto">
          {TABS.map((item) => {
            const active = tab === item.id;
            const count = tabCount(item.id);
            return (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) tabButtonRefs.current[item.id] = node;
                  else delete tabButtonRefs.current[item.id];
                }}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-white text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {count != null && count > 0 && (
                  <span className={cn("ml-1.5", active ? "opacity-90" : "text-primary")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : listQuery.isError ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Could not load this list.</p>
      ) : items.length === 0 ? (
        <EmptyTab tab={tab} onInvite={() => setInviteOpen(true)} />
      ) : (
        <div className={tab === "friends" ? undefined : "overflow-hidden rounded-2xl bg-white"}>
          <ul className={tab === "friends" ? "flex flex-col gap-3" : "divide-y divide-border"}>
            {items.map((item) =>
              tab === "suggestions" && isSuggestion(item) ? (
                <FriendIdCard
                  key={item.user.id}
                  name={item.user.name}
                  image={item.user.image}
                  subtitle={mutualLine(item)}
                  actions={
                    <>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={
                          requestMutation.isPending && requestMutation.variables === item.user.id
                        }
                        onClick={() => void addSuggested(item)}
                      >
                        {requestMutation.isPending && requestMutation.variables === item.user.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => dismissSuggestion(item.user.id)}
                      >
                        Delete
                      </Button>
                    </>
                  }
                />
              ) : !isSuggestion(item) ? (
                <FriendshipCard
                  key={item.friendshipId}
                  item={item}
                  busy={busyId === item.friendshipId}
                  onAccept={() => void accept(item.friendshipId)}
                  onDelete={() =>
                    item.status === "accepted"
                      ? confirmRemove(item)
                      : item.direction === "outgoing"
                        ? void cancelOutgoing(item.friendshipId)
                        : void decline(item.friendshipId)
                  }
                  onCancel={() => void cancelOutgoing(item.friendshipId)}
                />
              ) : null,
            )}
          </ul>
        </div>
      )}

      <div ref={sentinelRef} className="flex h-8 items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>

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

function FriendshipCard({
  item,
  busy,
  onAccept,
  onDelete,
  onCancel,
}: {
  item: FriendshipListItem;
  busy: boolean;
  onAccept: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const incoming = item.direction === "incoming" && item.status !== "accepted";
  const outgoing = item.direction === "outgoing" && item.status !== "accepted";
  const accepted = item.status === "accepted";

  return (
    <FriendIdCard
      name={item.user.name}
      image={item.user.image}
      separated={accepted}
      nameHref={accepted ? `/debts?friend=${encodeURIComponent(item.user.id)}` : undefined}
      subtitle={
        incoming ? "Wants to be friends" : outgoing ? "Request sent" : item.user.email
      }
      extra={accepted ? <BalanceBadge net={item.netBalance} /> : null}
      menu={accepted ? <FriendMenu busy={busy} onRemove={onDelete} /> : null}
      actions={
        accepted ? null : incoming ? (
          <>
            <Button size="sm" className="flex-1" disabled={busy} onClick={onAccept}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Accept"}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={onDelete}>
              Delete
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={onCancel}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Cancel"}
          </Button>
        )
      }
    />
  );
}

function FriendMenu({ busy, onRemove }: { busy: boolean; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={ref} className="absolute top-2 right-2">
      <button
        type="button"
        aria-label="Friend options"
        aria-expanded={open}
        disabled={busy}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-5" />}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 min-w-36 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-md">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            <UserMinus className="size-4" />
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function FriendIdCard({
  name,
  image,
  subtitle,
  extra,
  separated,
  nameHref,
  actions,
  menu,
}: {
  name: string;
  image: string | null;
  subtitle: string;
  extra?: ReactNode;
  separated?: boolean;
  nameHref?: string;
  actions?: ReactNode;
  menu?: ReactNode;
}) {
  const identity = (
    <>
      <p className="truncate font-semibold text-foreground">{name}</p>
      <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      {extra}
    </>
  );

  return (
    <li
      className={cn(
        "relative flex items-start gap-3 px-4 py-3.5",
        separated ? "rounded-2xl bg-white" : "bg-white",
      )}
    >
      <Avatar initial={name} image={image} />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2.5", menu && "pr-8")}>
        {nameHref ? (
          <Link href={nameHref} className="min-w-0 transition hover:opacity-80">
            {identity}
          </Link>
        ) : (
          <div className="min-w-0">{identity}</div>
        )}
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
      {menu}
    </li>
  );
}

function EmptyTab({ tab, onInvite }: { tab: FriendsListKind; onInvite: () => void }) {
  if (tab === "friends") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-10 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="font-semibold text-foreground">No friends yet</p>
        <p className="text-sm text-muted-foreground">
          Invite someone to track shared money together.
        </p>
        <Button onClick={onInvite}>
          <UserPlus className="size-4" />
          Add friend
        </Button>
      </div>
    );
  }

  if (tab === "requests") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-10 text-center">
        <p className="font-semibold text-foreground">No requests</p>
        <p className="text-sm text-muted-foreground">
          Incoming requests and invites you sent show up here.
        </p>
        <Button onClick={onInvite}>
          <UserPlus className="size-4" />
          Invite
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white px-6 py-10 text-center">
      <p className="font-semibold text-foreground">No suggestions</p>
      <p className="mt-1 text-sm text-muted-foreground">
        People your friends know will appear here.
      </p>
    </div>
  );
}

function Avatar({
  initial,
  image,
}: {
  initial: string;
  image: string | null;
}) {
  const letter = initial.charAt(0).toUpperCase() || "?";
  const sizeClass = "size-16 text-xl";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-foreground/10", sizeClass)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border bg-white font-bold text-primary",
        sizeClass,
      )}
    >
      {letter}
    </span>
  );
}

function BalanceBadge({ net }: { net: number }) {
  if (Math.abs(net) < 0.005) {
    return <span className="text-xs font-medium text-muted-foreground">Settled</span>;
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
