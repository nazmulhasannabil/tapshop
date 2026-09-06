import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Shared catalog categories (Grocery, Hangout, Party, plus user-created ones).
 * Items reference a category by id for filtering on Home.
 */
export const categories = pgTable(
  "categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_name_unique_idx").on(t.name),
    index("categories_created_at_idx").on(t.createdAt),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

/** Stable ids for the three default categories seeded on first run. */
export const DEFAULT_CATEGORY_IDS = {
  grocery: "cat_grocery",
  hangout: "cat_hangout",
  party: "cat_party",
} as const;

export const DEFAULT_CATEGORIES = [
  { id: DEFAULT_CATEGORY_IDS.grocery, name: "Grocery" },
  { id: DEFAULT_CATEGORY_IDS.hangout, name: "Hangout" },
  { id: DEFAULT_CATEGORY_IDS.party, name: "Party" },
] as const;
