import { and, count, eq, ilike, or, ne, desc, inArray, lt } from "drizzle-orm";

import { FRIENDS_PAGE_SIZE, FRIENDS_PAGE_SIZE_MAX } from "@/lib/constants";

import { db } from "@/db";
import {
  friendships,
  friendInvites,
  users,
  debtEntries,
} from "@/db/schema";
import {
  FRIENDSHIP_STATUS,
  FRIEND_INVITE_STATUS,
  DEBT_STATUS,
} from "@/lib/social-constants";
import {
  inviteRegisterUrl,
  sendFriendInviteEmail,
} from "@/lib/email/invite-email";
import { appUrl } from "@/lib/config/env";
import { gravatarUrl } from "@/lib/gravatar";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function inviteEmailMessage(
  recipient: string,
  mail: { sent: boolean; error?: string },
  sentLabel: string,
): string {
  if (mail.sent) return sentLabel;
  const hint = mail.error ? ` ${mail.error}` : "";
  return `Invite created for ${recipient}. Share the link below.${hint}`;
}

export type FriendUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type FriendshipListItem = {
  friendshipId: string;
  status: string;
  direction: "incoming" | "outgoing";
  user: FriendUser;
  /** Net open balance from viewer perspective: positive = they owe you. */
  netBalance: number;
};

/** Friend of a friend only — one mutual hop, never a third layer. */
export type SuggestedFriend = {
  user: FriendUser;
  mutualCount: number;
  mutualNames: string[];
};

export type FriendsOverview = {
  friends: FriendshipListItem[];
  pendingIncoming: FriendshipListItem[];
  pendingOutgoing: FriendshipListItem[];
  suggestions: SuggestedFriend[];
};

export type FriendsListKind = "friends" | "requests" | "suggestions";

export type FriendTabCounts = {
  friends: number;
  requests: number;
  suggestions: number;
  /** Incoming pending only — bottom-nav badge. */
  pendingIncoming: number;
};

export type FriendsListPage = {
  list: FriendsListKind;
  items: Array<FriendshipListItem | SuggestedFriend>;
  nextCursor: string | null;
  counts: FriendTabCounts;
};

export function clampFriendsPageSize(limit: number | undefined): number {
  if (limit == null || !Number.isFinite(limit) || limit < 1) return FRIENDS_PAGE_SIZE;
  return Math.min(Math.floor(limit), FRIENDS_PAGE_SIZE_MAX);
}

const SUGGESTION_LIMIT = 20;

export type InviteResult = {
  kind: "friendship" | "invite";
  friendshipId?: string;
  inviteId?: string;
  token?: string;
  inviteUrl: string;
  emailSent: boolean;
  message: string;
};

export type InvitePreview = {
  token: string;
  email: string;
  inviterName: string;
  expired: boolean;
  status: string;
};

/** Same resolution as the profile screen: uploaded photo, else Gravatar. */
function asFriendUser(row: {
  id: string;
  name: string;
  email: string;
  image: string | null;
}): FriendUser {
  const uploaded = row.image?.trim();
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: uploaded ? uploaded : gravatarUrl(row.email, 128),
  };
}

function otherUserId(row: { requesterId: string; addresseeId: string }, me: string) {
  return row.requesterId === me ? row.addresseeId : row.requesterId;
}

async function findExistingPair(a: string, b: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
        and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

async function netBalanceWithFriend(me: string, friendId: string): Promise<number> {
  const rows = await db
    .select({
      amount: debtEntries.amount,
      lenderUserId: debtEntries.lenderUserId,
      borrowerUserId: debtEntries.borrowerUserId,
    })
    .from(debtEntries)
    .where(
      and(
        eq(debtEntries.status, DEBT_STATUS.OPEN),
        or(
          and(eq(debtEntries.lenderUserId, me), eq(debtEntries.borrowerUserId, friendId)),
          and(eq(debtEntries.lenderUserId, friendId), eq(debtEntries.borrowerUserId, me)),
        ),
      ),
    );

  let net = 0;
  for (const r of rows) {
    const amt = Number(r.amount);
    if (r.lenderUserId === me) net += amt;
    else net -= amt;
  }
  return net;
}

async function mapFriendshipRows(
  me: string,
  rows: (typeof friendships.$inferSelect)[],
): Promise<FriendshipListItem[]> {
  if (rows.length === 0) return [];

  const otherIds = rows.map((r) => otherUserId(r, me));
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(or(...otherIds.map((id) => eq(users.id, id))));

  const byId = new Map(userRows.map((u) => [u.id, u]));

  const items: FriendshipListItem[] = [];
  for (const row of rows) {
    const oid = otherUserId(row, me);
    const u = byId.get(oid);
    if (!u) continue;
    const netBalance =
      row.status === FRIENDSHIP_STATUS.ACCEPTED ? await netBalanceWithFriend(me, oid) : 0;
    items.push({
      friendshipId: row.id,
      status: row.status,
      direction: row.addresseeId === me ? "incoming" : "outgoing",
      user: asFriendUser(u),
      netBalance,
    });
  }
  return items;
}

/**
 * Friends of accepted friends only.
 * Candidate -> mutual friend ids. Excludes self and anyone with any friendship row.
 */
async function friendOfFriendMutuals(userId: string): Promise<Map<string, string[]>> {
  const myRows = await db
    .select({
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
      status: friendships.status,
    })
    .from(friendships)
    .where(or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)));

  const friendIds: string[] = [];
  const relatedIds = new Set<string>([userId]);
  for (const row of myRows) {
    const other = otherUserId(row, userId);
    relatedIds.add(other);
    if (row.status === FRIENDSHIP_STATUS.ACCEPTED) friendIds.push(other);
  }
  if (friendIds.length === 0) return new Map();

  const friendIdSet = new Set(friendIds);
  const foafRows = await db
    .select({
      requesterId: friendships.requesterId,
      addresseeId: friendships.addresseeId,
    })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, FRIENDSHIP_STATUS.ACCEPTED),
        or(
          inArray(friendships.requesterId, friendIds),
          inArray(friendships.addresseeId, friendIds),
        ),
      ),
    );

  const mutuals = new Map<string, Set<string>>();
  for (const row of foafRows) {
    const reqIsFriend = friendIdSet.has(row.requesterId);
    const addIsFriend = friendIdSet.has(row.addresseeId);
    let mutualId: string;
    let otherId: string;
    if (reqIsFriend && !addIsFriend) {
      mutualId = row.requesterId;
      otherId = row.addresseeId;
    } else if (addIsFriend && !reqIsFriend) {
      mutualId = row.addresseeId;
      otherId = row.requesterId;
    } else {
      continue;
    }
    if (relatedIds.has(otherId)) continue;

    let set = mutuals.get(otherId);
    if (!set) {
      set = new Set();
      mutuals.set(otherId, set);
    }
    set.add(mutualId);
  }

  return new Map([...mutuals.entries()].map(([id, ids]) => [id, [...ids]]));
}

/** People you may know: one hop through an accepted friend, never further. */
export async function getPeopleYouMayKnow(userId: string): Promise<SuggestedFriend[]> {
  const mutuals = await friendOfFriendMutuals(userId);
  if (mutuals.size === 0) return [];

  const ranked = [...mutuals.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, SUGGESTION_LIMIT);

  const candidateIds = ranked.map(([id]) => id);
  const mutualIds = [...new Set(ranked.flatMap(([, ids]) => ids))];

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(inArray(users.id, [...candidateIds, ...mutualIds]));

  const byId = new Map(userRows.map((u) => [u.id, u]));

  const suggestions: SuggestedFriend[] = [];
  for (const [id, ids] of ranked) {
    const user = byId.get(id);
    if (!user) continue;
    const mutualNames = ids
      .map((mid) => byId.get(mid)?.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 2);
    suggestions.push({
      user: asFriendUser(user),
      mutualCount: ids.length,
      mutualNames,
    });
  }
  return suggestions;
}

function encodeFriendCursor(updatedAt: Date, id: string) {
  return `${updatedAt.toISOString()}|${id}`;
}

export function decodeFriendCursor(cursor: string): { updatedAt: Date; id: string } | null {
  const idx = cursor.lastIndexOf("|");
  if (idx <= 0) return null;
  const updatedAt = new Date(cursor.slice(0, idx));
  const id = cursor.slice(idx + 1);
  if (!id || Number.isNaN(updatedAt.getTime())) return null;
  return { updatedAt, id };
}

function involvedWith(userId: string) {
  return or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId));
}

async function countFriendships(
  userId: string,
  status: string,
  direction?: "incoming" | "outgoing",
): Promise<number> {
  const side =
    direction === "incoming"
      ? eq(friendships.addresseeId, userId)
      : direction === "outgoing"
        ? eq(friendships.requesterId, userId)
        : involvedWith(userId);

  const [row] = await db
    .select({ value: count() })
    .from(friendships)
    .where(and(side, eq(friendships.status, status)));
  return Number(row?.value ?? 0);
}

/** Capsule badges and the nav badge. Does not load list rows. */
export async function getFriendTabCounts(userId: string): Promise<FriendTabCounts> {
  const [friends, pendingIncoming, pendingOutgoing, mutuals] = await Promise.all([
    countFriendships(userId, FRIENDSHIP_STATUS.ACCEPTED),
    countFriendships(userId, FRIENDSHIP_STATUS.PENDING, "incoming"),
    countFriendships(userId, FRIENDSHIP_STATUS.PENDING, "outgoing"),
    friendOfFriendMutuals(userId),
  ]);
  return {
    friends,
    requests: pendingIncoming + pendingOutgoing,
    suggestions: mutuals.size,
    pendingIncoming,
  };
}

async function pageFriendships(
  userId: string,
  status: string,
  cursor: string | null,
  limit: number,
): Promise<{ items: FriendshipListItem[]; nextCursor: string | null }> {
  const decoded = cursor ? decodeFriendCursor(cursor) : null;
  const conditions = [involvedWith(userId), eq(friendships.status, status)];
  if (decoded) {
    conditions.push(
      or(
        lt(friendships.updatedAt, decoded.updatedAt),
        and(eq(friendships.updatedAt, decoded.updatedAt), lt(friendships.id, decoded.id)),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(friendships)
    .where(and(...conditions))
    .orderBy(desc(friendships.updatedAt), desc(friendships.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = await mapFriendshipRows(userId, pageRows);
  const last = pageRows[pageRows.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? encodeFriendCursor(last.updatedAt, last.id) : null,
  };
}

async function pageSuggestions(
  userId: string,
  cursor: string | null,
  limit: number,
): Promise<{ items: SuggestedFriend[]; nextCursor: string | null }> {
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;
  const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  const mutuals = await friendOfFriendMutuals(userId);
  const ranked = [...mutuals.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]),
  );
  const slice = ranked.slice(safeOffset, safeOffset + limit);
  if (slice.length === 0) return { items: [], nextCursor: null };

  const candidateIds = slice.map(([id]) => id);
  const mutualIds = [...new Set(slice.flatMap(([, ids]) => ids))];
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(inArray(users.id, [...candidateIds, ...mutualIds]));

  const byId = new Map(userRows.map((u) => [u.id, u]));
  const items: SuggestedFriend[] = [];
  for (const [id, ids] of slice) {
    const user = byId.get(id);
    if (!user) continue;
    const mutualNames = ids
      .map((mid) => byId.get(mid)?.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 2);
    items.push({ user: asFriendUser(user), mutualCount: ids.length, mutualNames });
  }

  const nextOffset = safeOffset + limit;
  return {
    items,
    nextCursor: nextOffset < ranked.length ? String(nextOffset) : null,
  };
}

/** One page of a friends tab. `limit` is clamped to 1–15. */
export async function getFriendsListPage(
  userId: string,
  list: FriendsListKind,
  cursor: string | null,
  limit: number = FRIENDS_PAGE_SIZE,
): Promise<FriendsListPage> {
  const size = clampFriendsPageSize(limit);
  const [page, counts] = await Promise.all([
    list === "friends"
      ? pageFriendships(userId, FRIENDSHIP_STATUS.ACCEPTED, cursor, size)
      : list === "requests"
        ? pageFriendships(userId, FRIENDSHIP_STATUS.PENDING, cursor, size)
        : pageSuggestions(userId, cursor, size),
    getFriendTabCounts(userId),
  ]);

  return {
    list,
    items: page.items,
    nextCursor: page.nextCursor,
    counts,
  };
}

/** Full friends overview for the Friends page. */
export async function getFriendsOverview(userId: string): Promise<FriendsOverview> {
  const rows = await db
    .select()
    .from(friendships)
    .where(
      and(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        or(
          eq(friendships.status, FRIENDSHIP_STATUS.ACCEPTED),
          eq(friendships.status, FRIENDSHIP_STATUS.PENDING),
        ),
      ),
    )
    .orderBy(desc(friendships.updatedAt));

  const accepted = rows.filter((r) => r.status === FRIENDSHIP_STATUS.ACCEPTED);
  const pending = rows.filter((r) => r.status === FRIENDSHIP_STATUS.PENDING);

  const [friends, pendingMapped, suggestions] = await Promise.all([
    mapFriendshipRows(userId, accepted),
    mapFriendshipRows(userId, pending),
    getPeopleYouMayKnow(userId),
  ]);

  return {
    friends,
    pendingIncoming: pendingMapped.filter((p) => p.direction === "incoming"),
    pendingOutgoing: pendingMapped.filter((p) => p.direction === "outgoing"),
    suggestions,
  };
}

/** Autocomplete: accepted friends matching name/email. */
export async function searchFriends(userId: string, q: string): Promise<FriendUser[]> {
  const query = q.trim();
  if (!query) return [];

  const pattern = `%${query}%`;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(friendships)
    .innerJoin(
      users,
      or(
        and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
        and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId)),
      ),
    )
    .where(
      and(
        eq(friendships.status, FRIENDSHIP_STATUS.ACCEPTED),
        or(ilike(users.name, pattern), ilike(users.email, pattern)),
        ne(users.id, userId),
      ),
    )
    .limit(20);

  return rows.map(asFriendUser);
}

/** Public preview for register/login invite pages. */
export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const rows = await db
    .select({
      token: friendInvites.token,
      email: friendInvites.email,
      status: friendInvites.status,
      expiresAt: friendInvites.expiresAt,
      inviterName: users.name,
    })
    .from(friendInvites)
    .innerJoin(users, eq(users.id, friendInvites.inviterId))
    .where(eq(friendInvites.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const expired =
    row.status !== FRIEND_INVITE_STATUS.PENDING || row.expiresAt.getTime() < Date.now();

  return {
    token: row.token,
    email: row.email,
    inviterName: row.inviterName,
    expired,
    status: expired && row.status === FRIEND_INVITE_STATUS.PENDING ? "expired" : row.status,
  };
}

/**
 * Invite by email. If the email already belongs to a user, create a pending
 * friendship. Otherwise create a friend_invite + optional email.
 */
export async function inviteFriend(
  inviterId: string,
  inviterName: string,
  email: string,
): Promise<InviteResult> {
  const normalized = email.trim().toLowerCase();

  const me = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, inviterId))
    .limit(1);
  if (me[0]?.email.toLowerCase() === normalized) {
    throw new Error("You can't invite yourself.");
  }

  const existingUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (existingUsers[0]) {
    const target = existingUsers[0];
    const pair = await findExistingPair(inviterId, target.id);
    if (pair) {
      if (pair.status === FRIENDSHIP_STATUS.ACCEPTED) {
        throw new Error("You're already friends.");
      }
      if (pair.status === FRIENDSHIP_STATUS.PENDING) {
        throw new Error("A friend request is already pending.");
      }
      // Re-open declined/cancelled as a fresh pending request from inviter.
      await db
        .update(friendships)
        .set({
          requesterId: inviterId,
          addresseeId: target.id,
          status: FRIENDSHIP_STATUS.PENDING,
          updatedAt: new Date(),
        })
        .where(eq(friendships.id, pair.id));

      const friendsUrl = `${appUrl}/friends`;
      const mail = await sendFriendInviteEmail({
        to: normalized,
        inviterName,
        inviteUrl: friendsUrl,
      });
      return {
        kind: "friendship",
        friendshipId: pair.id,
        inviteUrl: friendsUrl,
        emailSent: mail.sent,
        message: inviteEmailMessage(
          target.name,
          mail,
          `Friend request sent to ${target.name}.`,
        ),
      };
    }

    const [created] = await db
      .insert(friendships)
      .values({
        requesterId: inviterId,
        addresseeId: target.id,
        status: FRIENDSHIP_STATUS.PENDING,
      })
      .returning();

    const friendsUrl = `${appUrl}/friends`;
    const mail = await sendFriendInviteEmail({
      to: normalized,
      inviterName,
      inviteUrl: friendsUrl,
    });

    return {
      kind: "friendship",
      friendshipId: created.id,
      inviteUrl: friendsUrl,
      emailSent: mail.sent,
      message: inviteEmailMessage(
        target.name,
        mail,
        `Friend request sent to ${target.name}.`,
      ),
    };
  }

  // No account yet — create or reuse pending invite.
  const existingInvite = await db
    .select()
    .from(friendInvites)
    .where(
      and(
        eq(friendInvites.inviterId, inviterId),
        eq(friendInvites.email, normalized),
        eq(friendInvites.status, FRIEND_INVITE_STATUS.PENDING),
      ),
    )
    .limit(1);

  let invite = existingInvite[0];
  if (!invite || invite.expiresAt.getTime() < Date.now()) {
    if (invite) {
      await db
        .update(friendInvites)
        .set({ status: FRIEND_INVITE_STATUS.EXPIRED })
        .where(eq(friendInvites.id, invite.id));
    }
    const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    const [created] = await db
      .insert(friendInvites)
      .values({
        inviterId,
        email: normalized,
        token,
        status: FRIEND_INVITE_STATUS.PENDING,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      })
      .returning();
    invite = created;
  }

  const inviteUrl = inviteRegisterUrl(invite.token);
  const mail = await sendFriendInviteEmail({
    to: normalized,
    inviterName,
    inviteUrl,
  });

  return {
    kind: "invite",
    inviteId: invite.id,
    token: invite.token,
    inviteUrl,
    emailSent: mail.sent,
    message: inviteEmailMessage(
      normalized,
      mail,
      `Invite sent to ${normalized}.`,
    ),
  };
}

/**
 * Send a friend request to someone you already know through one mutual friend.
 * Refuses strangers and anyone beyond two layers.
 */
export async function requestFriendship(
  userId: string,
  targetUserId: string,
): Promise<{ friendshipId: string; message: string }> {
  if (userId === targetUserId) {
    throw new Error("You can't add yourself.");
  }

  const mutuals = await friendOfFriendMutuals(userId);
  if (!mutuals.has(targetUserId)) {
    throw new Error("You can only add friends of your friends.");
  }

  const [me, target] = await Promise.all([
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1),
  ]);

  if (!target[0]) throw new Error("Person not found.");

  const pair = await findExistingPair(userId, targetUserId);
  if (pair) {
    if (pair.status === FRIENDSHIP_STATUS.ACCEPTED) {
      throw new Error("You're already friends.");
    }
    if (pair.status === FRIENDSHIP_STATUS.PENDING) {
      throw new Error("A friend request is already pending.");
    }
    await db
      .update(friendships)
      .set({
        requesterId: userId,
        addresseeId: targetUserId,
        status: FRIENDSHIP_STATUS.PENDING,
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, pair.id));
  }

  const friendshipId = pair
    ? pair.id
    : (
        await db
          .insert(friendships)
          .values({
            requesterId: userId,
            addresseeId: targetUserId,
            status: FRIENDSHIP_STATUS.PENDING,
          })
          .returning()
      )[0].id;

  const friendsUrl = `${appUrl}/friends`;
  const mail = await sendFriendInviteEmail({
    to: target[0].email,
    inviterName: me[0]?.name ?? "Someone",
    inviteUrl: friendsUrl,
  });

  return {
    friendshipId,
    message: inviteEmailMessage(
      target[0].name,
      mail,
      `Friend request sent to ${target[0].name}.`,
    ),
  };
}

/** After register/login: turn invite token into a pending friendship. */
export async function claimInvite(
  userId: string,
  userEmail: string,
  token: string,
): Promise<{ friendshipId: string; inviterName: string }> {
  const rows = await db
    .select()
    .from(friendInvites)
    .where(eq(friendInvites.token, token))
    .limit(1);
  const invite = rows[0];
  if (!invite) throw new Error("Invite not found.");
  if (invite.status !== FRIEND_INVITE_STATUS.PENDING) {
    throw new Error("This invite is no longer valid.");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await db
      .update(friendInvites)
      .set({ status: FRIEND_INVITE_STATUS.EXPIRED })
      .where(eq(friendInvites.id, invite.id));
    throw new Error("This invite has expired.");
  }
  if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
    throw new Error("Sign in with the email that received the invite.");
  }
  if (invite.inviterId === userId) {
    throw new Error("You can't accept your own invite.");
  }

  const inviter = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, invite.inviterId))
    .limit(1);

  let friendshipId: string;
  const pair = await findExistingPair(invite.inviterId, userId);
  if (pair) {
    if (pair.status === FRIENDSHIP_STATUS.ACCEPTED) {
      await db
        .update(friendInvites)
        .set({ status: FRIEND_INVITE_STATUS.ACCEPTED })
        .where(eq(friendInvites.id, invite.id));
      return { friendshipId: pair.id, inviterName: inviter[0]?.name ?? "Someone" };
    }
    await db
      .update(friendships)
      .set({
        requesterId: invite.inviterId,
        addresseeId: userId,
        status: FRIENDSHIP_STATUS.PENDING,
        updatedAt: new Date(),
      })
      .where(eq(friendships.id, pair.id));
    friendshipId = pair.id;
  } else {
    const [created] = await db
      .insert(friendships)
      .values({
        requesterId: invite.inviterId,
        addresseeId: userId,
        status: FRIENDSHIP_STATUS.PENDING,
      })
      .returning();
    friendshipId = created.id;
  }

  await db
    .update(friendInvites)
    .set({ status: FRIEND_INVITE_STATUS.ACCEPTED })
    .where(eq(friendInvites.id, invite.id));

  return { friendshipId, inviterName: inviter[0]?.name ?? "Someone" };
}

export async function acceptFriendship(userId: string, friendshipId: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Friend request not found.");
  if (row.addresseeId !== userId) throw new Error("Only the recipient can accept.");
  if (row.status !== FRIENDSHIP_STATUS.PENDING) {
    throw new Error("This request is no longer pending.");
  }

  await db
    .update(friendships)
    .set({ status: FRIENDSHIP_STATUS.ACCEPTED, updatedAt: new Date() })
    .where(eq(friendships.id, friendshipId));

  return { friendshipId, status: FRIENDSHIP_STATUS.ACCEPTED };
}

export async function declineFriendship(userId: string, friendshipId: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Friend request not found.");
  if (row.addresseeId !== userId && row.requesterId !== userId) {
    throw new Error("Not allowed.");
  }
  if (row.status !== FRIENDSHIP_STATUS.PENDING) {
    throw new Error("This request is no longer pending.");
  }

  const next =
    row.addresseeId === userId ? FRIENDSHIP_STATUS.DECLINED : FRIENDSHIP_STATUS.CANCELLED;

  await db
    .update(friendships)
    .set({ status: next, updatedAt: new Date() })
    .where(eq(friendships.id, friendshipId));

  return { friendshipId, status: next };
}

export async function removeFriendship(userId: string, friendshipId: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, friendshipId))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error("Friendship not found.");
  if (row.requesterId !== userId && row.addresseeId !== userId) {
    throw new Error("Not allowed.");
  }

  await db
    .update(friendships)
    .set({ status: FRIENDSHIP_STATUS.CANCELLED, updatedAt: new Date() })
    .where(eq(friendships.id, friendshipId));

  return { friendshipId, status: FRIENDSHIP_STATUS.CANCELLED };
}

/** Resolve accepted friendship id between two users, or null. */
export async function getAcceptedFriendshipId(
  a: string,
  b: string,
): Promise<string | null> {
  const pair = await findExistingPair(a, b);
  if (!pair || pair.status !== FRIENDSHIP_STATUS.ACCEPTED) return null;
  return pair.id;
}

/** Look up a friend user by id if accepted friends with me. */
export async function getAcceptedFriend(
  me: string,
  friendId: string,
): Promise<FriendUser | null> {
  const friendshipId = await getAcceptedFriendshipId(me, friendId);
  if (!friendshipId) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, friendId))
    .limit(1);
  return rows[0] ? asFriendUser(rows[0]) : null;
}
