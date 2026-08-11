import { pgTable, text, numeric, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Shop items a user can tap.
 *
 * `price` is the CURRENT price and may change over time — historical bills
 * must never be recomputed from it (see `bill_entries.unit_price` snapshot).
 *
 * `shopId` is reserved for a future multi-shop/workspace feature and is left
 * nullable so the schema won't need a rewrite later.
 */
export const items = pgTable(
  "items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    /** Optional emoji/short identifier for fast visual scanning. */
    icon: text("icon"),
    // Nullable so a shared item survives the deletion of its original creator.
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
    shopId: text("shop_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("items_active_recent_idx").on(t.isActive, t.lastUsedAt),
    index("items_created_by_idx").on(t.createdBy),
  ],
);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
