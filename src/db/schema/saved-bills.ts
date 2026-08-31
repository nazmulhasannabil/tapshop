import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { APP_TIMEZONE } from "@/lib/timezone";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import type { SavedBillItem } from "@/types/bill";

/**
 * A finalized/saved bill — a deliberate snapshot a user took of their bill.
 *
 * Unlike `bill_entries` (which auto-persists every tap and mutates as the user
 * keeps tapping), a row here is IMMUTABLE: it freezes the items + total at the
 * moment the user pressed "Save". The live "Today's Bill" is untouched by a
 * save, and multiple snapshots are allowed on the same date.
 *
 * `items` is a jsonb snapshot array (`{ name, icon, unitPrice, quantity,
 * subtotal }` per line) — the same jsonb-snapshot convention used by
 * `activity_logs`. This keeps a saved bill faithful forever, even if items are
 * later renamed, repriced, or deleted.
 */
export const savedBills = pgTable(
  "saved_bills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The day this bill is for (app timezone calendar date at save time). */
    billDate: date("bill_date", { mode: "string" })
      .notNull()
      .default(sql.raw(`(timezone('${APP_TIMEZONE}', now()))::date`)),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    /** Sum of every line's `quantity`. */
    itemCount: integer("item_count").notNull(),
    /** Snapshot of the bill lines at save time. */
    items: jsonb("items").$type<SavedBillItem[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    // Powers the paginated "Saved Bills" table (newest first).
    index("saved_bills_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export type SavedBillRow = typeof savedBills.$inferSelect;
export type NewSavedBillRow = typeof savedBills.$inferInsert;
