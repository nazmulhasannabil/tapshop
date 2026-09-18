import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Catalog categories: shared system defaults (Grocery, Hangout, Party) plus
 * per-user private categories. Visibility is scoped by `createdBy`.
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
    uniqueIndex("categories_owner_name_uidx").on(t.createdBy, sql`lower(${t.name})`),
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
