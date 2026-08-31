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
import { savedBills, type SavedBillRow } from "./saved-bills";
import { friendships, type Friendship } from "./friendships";
import { friendInvites, type FriendInvite } from "./friend-invites";
import { debtEntries, type DebtEntry } from "./debt-entries";

export {
  users,
  sessions,
  accounts,
  verifications,
  items,
  billEntries,
  activityLogs,
  savedBills,
  friendships,
  friendInvites,
  debtEntries,
};
export type {
  User,
  Session,
  Account,
  Item,
  BillEntry,
  ActivityLog,
  SavedBillRow,
  Friendship,
  FriendInvite,
  DebtEntry,
};

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

export {
  FRIENDSHIP_STATUS,
  FRIEND_INVITE_STATUS,
  DEBT_STATUS,
  DEBT_DIRECTION,
  type FriendshipStatus,
  type FriendInviteStatus,
  type DebtStatus,
  type DebtDirection,
} from "@/lib/social-constants";

/* -------------------------------- Relations ------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  billEntries: many(billEntries),
  savedBills: many(savedBills),
  createdItems: many(items),
  activityAsActor: many(activityLogs, { relationName: "actor" }),
  activityAsTarget: many(activityLogs, { relationName: "target" }),
  friendshipsRequested: many(friendships, { relationName: "requester" }),
  friendshipsReceived: many(friendships, { relationName: "addressee" }),
  friendInvitesSent: many(friendInvites),
  debtsCreated: many(debtEntries, { relationName: "debtCreator" }),
  debtsAsLender: many(debtEntries, { relationName: "debtLender" }),
  debtsAsBorrower: many(debtEntries, { relationName: "debtBorrower" }),
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

export const savedBillsRelations = relations(savedBills, ({ one }) => ({
  user: one(users, { fields: [savedBills.userId], references: [users.id] }),
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

export const friendshipsRelations = relations(friendships, ({ one, many }) => ({
  requester: one(users, {
    fields: [friendships.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [friendships.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
  debtEntries: many(debtEntries),
}));

export const friendInvitesRelations = relations(friendInvites, ({ one }) => ({
  inviter: one(users, {
    fields: [friendInvites.inviterId],
    references: [users.id],
  }),
}));

export const debtEntriesRelations = relations(debtEntries, ({ one }) => ({
  creator: one(users, {
    fields: [debtEntries.createdBy],
    references: [users.id],
    relationName: "debtCreator",
  }),
  lender: one(users, {
    fields: [debtEntries.lenderUserId],
    references: [users.id],
    relationName: "debtLender",
  }),
  borrower: one(users, {
    fields: [debtEntries.borrowerUserId],
    references: [users.id],
    relationName: "debtBorrower",
  }),
  friendship: one(friendships, {
    fields: [debtEntries.friendshipId],
    references: [friendships.id],
  }),
}));
