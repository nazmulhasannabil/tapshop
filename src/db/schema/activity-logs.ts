import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Append-only audit trail for both user actions and admin corrections.
 *
 * Every admin mutation writes a row here preserving who/when/old/new.
 */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id").references(() => users.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    action: text("action").notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_logs_created_idx").on(t.createdAt),
    index("activity_logs_actor_idx").on(t.actorId),
    index("activity_logs_target_idx").on(t.targetUserId),
  ],
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
