import { pgTable, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Bidirectional friendship between two users.
 *
 * `requester` sends the request; `addressee` accepts/declines.
 * Status `accepted` means both can search each other and share debt ledgers.
 */
export const friendships = pgTable(
  "friendships",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** pending | accepted | declined | cancelled */
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    unique("friendships_pair_uc").on(t.requesterId, t.addresseeId),
    index("friendships_requester_idx").on(t.requesterId, t.status),
    index("friendships_addressee_idx").on(t.addresseeId, t.status),
  ],
);

export type Friendship = typeof friendships.$inferSelect;
export type NewFriendship = typeof friendships.$inferInsert;
