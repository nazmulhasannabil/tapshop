import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  date,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { APP_TIMEZONE } from "@/lib/timezone";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { items } from "./items";

/**
 * The most important table.
 *
 * One row per (user, item, day) — the "current bill" is simply today's rows
 * for the user. Rapid taps are persisted with a single atomic upsert:
 *
 *   INSERT … VALUES (1, $price, $price, NOW(), app_today)
 *   ON CONFLICT (user_id, item_id, bill_date)
 *   DO UPDATE SET quantity = quantity + 1, subtotal = subtotal + EXCLUDED.unit_price
 *
 * 10 quick taps ⇒ 10 atomic +1s ⇒ final quantity exactly 10. There is no
 * client read-modify-write, so concurrent requests can never overwrite each
 * other.
 *
 * `unitPrice` is a SNAPSHOT captured at the moment of the tap. Historical rows
 * are never recomputed from `items.price`.
 *
 * `billDate` is the day bucket in {@link APP_TIMEZONE} (not bare UTC
 * CURRENT_DATE) used by the unique constraint and by history aggregation.
 */
export const billEntries = pgTable(
  "bill_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    /** Price snapshot — immutable for the life of the row. */
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    billDate: date("bill_date", { mode: "string" })
      .notNull()
      .default(sql.raw(`(timezone('${APP_TIMEZONE}', now()))::date`)),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // Powers the atomic upsert for rapid taps.
    unique("bill_entry_user_item_day_uc").on(t.userId, t.itemId, t.billDate),
    // Today's bill / history queries by consumed_at.
    index("bill_entries_user_date_idx").on(t.userId, t.consumedAt),
    // Day-bucket lookups (WHERE user_id + bill_date) — unique key has item_id in the middle.
    index("bill_entries_user_bill_date_idx").on(t.userId, t.billDate),
    index("bill_entries_item_idx").on(t.itemId),
  ],
);

export type BillEntry = typeof billEntries.$inferSelect;
export type NewBillEntry = typeof billEntries.$inferInsert;
