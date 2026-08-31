import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Email invite for someone who may not have an account yet.
 *
 * Link: `/register?invite=<token>` (or `/login?invite=<token>` if they already exist).
 * Claimed after signup/login via POST /api/friends/claim.
 */
export const friendInvites = pgTable(
  "friend_invites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Normalized lowercase email. */
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    /** pending | accepted | expired | cancelled */
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("friend_invites_inviter_idx").on(t.inviterId, t.status),
    index("friend_invites_email_idx").on(t.email, t.status),
  ],
);

export type FriendInvite = typeof friendInvites.$inferSelect;
export type NewFriendInvite = typeof friendInvites.$inferInsert;
