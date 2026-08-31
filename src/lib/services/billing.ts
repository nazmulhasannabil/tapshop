import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, billEntries, items } from "@/db/schema";
import { ACTION, ENTITY_TYPE } from "@/db/schema";
import { sqlAppToday } from "@/lib/timezone-sql";
import type {
  ActivityEntry,
  AddItemResult,
  BillLine,
  CatalogItem,
  DecreaseItemResult,
} from "@/types/bill";

/** Numeric columns come back as strings from Drizzle; coerce for the client. */
const num = (v: string | number): number => Number(v);

function toCatalogItem(row: {
  id: string;
  name: string;
  price: string | number;
  icon: string | null;
}): CatalogItem {
  return { id: row.id, name: row.name, price: num(row.price), icon: row.icon };
}

/* --------------------------------- Reads ---------------------------------- */

/** All active items, alphabetically (the "All Items" grid). */
export async function getActiveItems(): Promise<CatalogItem[]> {
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      price: items.price,
      icon: items.icon,
    })
    .from(items)
    .where(eq(items.isActive, true))
    .orderBy(asc(items.name));

  return rows.map(toCatalogItem);
}

/** Today's bill for a user (the lines under "Today's Bill"). */
export async function getTodayBill(userId: string): Promise<BillLine[]> {
  const rows = await db
    .select({
      itemId: billEntries.itemId,
      name: items.name,
      icon: items.icon,
      unitPrice: billEntries.unitPrice,
      quantity: billEntries.quantity,
      subtotal: billEntries.subtotal,
    })
    .from(billEntries)
    .innerJoin(items, eq(billEntries.itemId, items.id))
    .where(and(eq(billEntries.userId, userId), eq(billEntries.billDate, sqlAppToday())))
    .orderBy(desc(billEntries.updatedAt));

  return rows.map((r) => ({
    itemId: r.itemId,
    name: r.name,
    icon: r.icon,
    unitPrice: num(r.unitPrice),
    quantity: r.quantity,
    subtotal: num(r.subtotal),
  }));
}

/** Items the user has consumed most recently (fast re-tap targets). */
export async function getRecentItems(userId: string, limit = 8): Promise<CatalogItem[]> {
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      price: items.price,
      icon: items.icon,
    })
    .from(billEntries)
    .innerJoin(items, eq(billEntries.itemId, items.id))
    .where(eq(billEntries.userId, userId))
    .groupBy(items.id, items.name, items.price, items.icon)
    .orderBy(desc(sql`max(${billEntries.consumedAt})`))
    .limit(limit);

  return rows.map(toCatalogItem);
}

/** Items the user consumes most often over the last 30 days ("Your Go-To's"). */
export async function getFrequentItems(userId: string, limit = 6): Promise<CatalogItem[]> {
  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      price: items.price,
      icon: items.icon,
    })
    .from(billEntries)
    .innerJoin(items, eq(billEntries.itemId, items.id))
    .where(and(eq(billEntries.userId, userId), gteLast30Days()))
    .groupBy(items.id, items.name, items.price, items.icon)
    .orderBy(desc(sql`sum(${billEntries.quantity})`))
    .limit(limit);

  return rows.map(toCatalogItem);
}

function gteLast30Days() {
  return sql`${billEntries.consumedAt} >= NOW() - INTERVAL '30 days'`;
}

/**
 * A user's recent activity feed: one entry per item-per-day, newest tap first.
 * Because taps are aggregated per (user, item, day), each entry may stand for
 * several taps of the same item on the same day.
 */
export async function getActivityFeed(
  userId: string,
  limit = 30,
): Promise<ActivityEntry[]> {
  const rows = await db
    .select({
      id: billEntries.id,
      itemId: billEntries.itemId,
      name: items.name,
      icon: items.icon,
      quantity: billEntries.quantity,
      unitPrice: billEntries.unitPrice,
      subtotal: billEntries.subtotal,
      consumedAt: billEntries.consumedAt,
      updatedAt: billEntries.updatedAt,
    })
    .from(billEntries)
    .innerJoin(items, eq(billEntries.itemId, items.id))
    .where(eq(billEntries.userId, userId))
    .orderBy(desc(billEntries.updatedAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    name: r.name,
    icon: r.icon,
    quantity: r.quantity,
    unitPrice: num(r.unitPrice),
    subtotal: num(r.subtotal),
    consumedAt: r.consumedAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

/* -------------------------------- Mutations ------------------------------- */

/**
 * The rapid-tap-safe add. A single atomic upsert increments quantity and
 * subtotal. 10 quick taps ⇒ 10 atomic +1s ⇒ final quantity exactly 10.
 *
 * `unit_price` is a SNAPSHOT: on conflict we increment `subtotal` by the
 * STORED unit price, never by the live item price, so historical lines stay
 * consistent even if `items.price` changes mid-day.
 */
export async function addItemToBill(
  userId: string,
  itemId: string,
): Promise<AddItemResult> {
  const item = await db
    .select({ price: items.price })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.isActive, true)))
    .limit(1);
  if (item.length === 0) {
    throw new BillingError("ITEM_NOT_FOUND", "We couldn't find that item.");
  }

  const price = item[0].price; // snapshot string

  const [row] = await db
    .insert(billEntries)
    .values({
      userId,
      itemId,
      quantity: 1,
      unitPrice: price,
      subtotal: price,
      billDate: sqlAppToday(),
    })
    .onConflictDoUpdate({
      target: [billEntries.userId, billEntries.itemId, billEntries.billDate],
      set: {
        quantity: sql`${billEntries.quantity} + 1`,
        // Use the stored snapshot price, not the live price.
        subtotal: sql`${billEntries.subtotal} + ${billEntries.unitPrice}`,
        updatedAt: new Date(),
      },
    })
    .returning({
      itemId: billEntries.itemId,
      quantity: billEntries.quantity,
      unitPrice: billEntries.unitPrice,
      subtotal: billEntries.subtotal,
    });

  // Touch recency so the item floats up in "Recently Used".
  await db
    .update(items)
    .set({ lastUsedAt: new Date(), updatedAt: new Date() })
    .where(eq(items.id, itemId));

  return {
    itemId: row.itemId,
    quantity: row.quantity,
    unitPrice: num(row.unitPrice),
    subtotal: num(row.subtotal),
  };
}

/**
 * Decrease by one. User-initiated correction (not rapid), so a guarded
 * read-then-write is acceptable here. Deletes the line when it reaches zero.
 */
export async function decreaseItemFromBill(
  userId: string,
  itemId: string,
): Promise<DecreaseItemResult> {
  const [entry] = await db
    .select({
      id: billEntries.id,
      quantity: billEntries.quantity,
      unitPrice: billEntries.unitPrice,
    })
    .from(billEntries)
    .where(and(eq(billEntries.userId, userId), eq(billEntries.itemId, itemId)))
    .limit(1);

  if (!entry) return { itemId, quantity: 0, deleted: true };

  if (entry.quantity <= 1) {
    await db.delete(billEntries).where(eq(billEntries.id, entry.id));
    return { itemId, quantity: 0, deleted: true };
  }

  const [updated] = await db
    .update(billEntries)
    .set({
      quantity: sql`${billEntries.quantity} - 1`,
      subtotal: sql`${billEntries.subtotal} - ${billEntries.unitPrice}`,
      updatedAt: new Date(),
    })
    .where(eq(billEntries.id, entry.id))
    .returning({ quantity: billEntries.quantity });

  return { itemId, quantity: updated.quantity, deleted: false };
}

/** Remove today's line for an item entirely. */
export async function removeBillEntry(userId: string, itemId: string): Promise<void> {
  await db
    .delete(billEntries)
    .where(and(eq(billEntries.userId, userId), eq(billEntries.itemId, itemId)));

  await db.insert(activityLogs).values({
    actorId: userId,
    entityType: ENTITY_TYPE.BILL_ENTRY,
    entityId: itemId,
    action: ACTION.USER_REMOVED_ENTRY,
  });
}

/** Create a new item, owned by the creator. */
export async function createItem(
  userId: string,
  input: { name: string; price: number; icon?: string | null },
): Promise<CatalogItem> {
  const [row] = await db
    .insert(items)
    .values({
      name: input.name,
      price: input.price.toFixed(2),
      icon: input.icon ?? null,
      createdBy: userId,
      lastUsedAt: new Date(),
    })
    .returning({
      id: items.id,
      name: items.name,
      price: items.price,
      icon: items.icon,
    });

  await db.insert(activityLogs).values({
    actorId: userId,
    entityType: ENTITY_TYPE.ITEM,
    entityId: row.id,
    action: ACTION.USER_CREATED_ITEM,
  });

  return toCatalogItem(row);
}

/** Typed service error so route handlers can map to HTTP statuses cleanly. */
export class BillingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "BillingError";
  }
}
