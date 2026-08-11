import { relations } from "drizzle-orm";
import {
  users,
  sessions,
  accounts,
  verifications,
  type User,
  type Session,
  type Account,
} from "./auth";
import { items, type Item } from "./items";
import { billEntries, type BillEntry } from "./bill-entries";
import { activityLogs, type ActivityLog } from "./activity-logs";

export { users, sessions, accounts, verifications, items, billEntries, activityLogs };
export type { User, Session, Account, Item, BillEntry, ActivityLog };

/* ---------------------------------- Enums --------------------------------- */

export const USER_ROLE = {
  USER: "user",
  ADMIN: "admin",
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/** Activity-log `entity_type` values. */
export const ENTITY_TYPE = {
  BILL_ENTRY: "bill_entry",
  ITEM: "item",
  USER: "user",
} as const;

/** Activity-log `action` values. */
export const ACTION = {
  USER_ADDED_ITEM: "user_added_item",
  USER_ADDED_QUANTITY: "user_added_quantity",
  USER_DECREASED_QUANTITY: "user_decreased_quantity",
  USER_REMOVED_ENTRY: "user_removed_entry",
  USER_CREATED_ITEM: "user_created_item",
  ADMIN_CORRECTED_ENTRY: "admin_corrected_entry",
  ADMIN_DELETED_ENTRY: "admin_deleted_entry",
  ADMIN_CHANGED_ITEM: "admin_changed_item",
} as const;

/* -------------------------------- Relations ------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  billEntries: many(billEntries),
  createdItems: many(items),
  activityAsActor: many(activityLogs, { relationName: "actor" }),
  activityAsTarget: many(activityLogs, { relationName: "target" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const itemsRelations = relations(items, ({ many, one }) => ({
  billEntries: many(billEntries),
  creator: one(users, { fields: [items.createdBy], references: [users.id] }),
}));

export const billEntriesRelations = relations(billEntries, ({ one }) => ({
  user: one(users, { fields: [billEntries.userId], references: [users.id] }),
  item: one(items, { fields: [billEntries.itemId], references: [items.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  actor: one(users, {
    fields: [activityLogs.actorId],
    references: [users.id],
    relationName: "actor",
  }),
  targetUser: one(users, {
    fields: [activityLogs.targetUserId],
    references: [users.id],
    relationName: "target",
  }),
}));
