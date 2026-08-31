import { pgTable, text, numeric, timestamp, date, index } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { friendships } from "./friendships";

/**
 * Shared (or private) debt ledger entry.
 *
 * Absolute roles: `lender` is owed money; `borrower` owes.
 * When both user ids are set (friends), both parties can see the same row.
 * Free-text counterparties keep the other side's user id null (creator-only).
 */
export const debtEntries = pgTable(
  "debt_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lenderUserId: text("lender_user_id").references(() => users.id, { onDelete: "set null" }),
    borrowerUserId: text("borrower_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    lenderName: text("lender_name").notNull(),
    borrowerName: text("borrower_name").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("BDT"),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    note: text("note"),
    /** open | settled | cancelled */
    status: text("status").notNull().default("open"),
    friendshipId: text("friendship_id").references(() => friendships.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("debt_entries_created_by_idx").on(t.createdBy, t.status),
    index("debt_entries_lender_idx").on(t.lenderUserId, t.status),
    index("debt_entries_borrower_idx").on(t.borrowerUserId, t.status),
    index("debt_entries_occurred_on_idx").on(t.occurredOn),
  ],
);

export type DebtEntry = typeof debtEntries.$inferSelect;
export type NewDebtEntry = typeof debtEntries.$inferInsert;
