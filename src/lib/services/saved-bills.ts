import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { billEntries, savedBills } from "@/db/schema";
import { BillingError, getTodayBill } from "@/lib/services/billing";
import type {
  Paginated,
  SaveBillResult,
  SavedBill,
  SavedBillItem,
} from "@/types/bill";

/** Numeric columns come back as strings from Drizzle; coerce for the client. */
const num = (v: string | number): number => Number(v);

/** Rows per page on the Activity table. */
export const SAVED_BILLS_PAGE_SIZE = 10;

/**
 * Save today's bill as an immutable `saved_bills` snapshot, THEN clear today's
 * `bill_entries` so the user can start a fresh bill.
 *
 * Checkout semantics: the lines are read first (source of truth is the
 * server-side entries, not client state) and frozen into the snapshot before
 * today's rows are deleted, so the saved bill always reflects what was tapped.
 * The snapshot insert and the clear run as separate statements (the Neon HTTP
 * driver doesn't support interactive transactions); a tap arriving in the tiny
 * window between the read and the delete would be cleared without landing in
 * the snapshot — an acceptable edge case for this app.
 */
export async function saveTodayBill(userId: string): Promise<SaveBillResult> {
  const lines = await getTodayBill(userId);
  if (lines.length === 0) {
    throw new BillingError("EMPTY_BILL", "Your bill is empty.");
  }

  const items: SavedBillItem[] = lines.map((l) => ({
    name: l.name,
    icon: l.icon,
    unitPrice: l.unitPrice,
    quantity: l.quantity,
    subtotal: l.subtotal,
  }));

  const total = items.reduce((sum, it) => sum + it.subtotal, 0);
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  const [row] = await db
    .insert(savedBills)
    .values({
      userId,
      total: total.toFixed(2),
      itemCount,
      items,
    })
    .returning({
      id: savedBills.id,
      billDate: savedBills.billDate,
      total: savedBills.total,
      itemCount: savedBills.itemCount,
      createdAt: savedBills.createdAt,
    });

  // Clear today's bill so the user is ready to create the next one.
  await db
    .delete(billEntries)
    .where(and(eq(billEntries.userId, userId), eq(billEntries.billDate, sql`CURRENT_DATE`)));

  return {
    id: row.id,
    billDate: row.billDate,
    total: num(row.total),
    itemCount: row.itemCount,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * A page of a user's saved bills, newest first.
 *
 * Two queries: a `count(*)` for totals, then a `LIMIT/OFFSET` page. `page` is
 * clamped to `>= 1`; `totalPages` is always `>= 1` so the UI can render
 * controls even when there are zero rows.
 */
export async function getSavedBills(
  userId: string,
  page: number,
  pageSize: number = SAVED_BILLS_PAGE_SIZE,
): Promise<Paginated<SavedBill>> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * pageSize;

  const [[totalRow], rows] = await Promise.all([
    db.select({ value: count() }).from(savedBills).where(eq(savedBills.userId, userId)),
    db
      .select({
        id: savedBills.id,
        billDate: savedBills.billDate,
        total: savedBills.total,
        itemCount: savedBills.itemCount,
        items: savedBills.items,
        createdAt: savedBills.createdAt,
      })
      .from(savedBills)
      .where(eq(savedBills.userId, userId))
      .orderBy(desc(savedBills.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(totalRow?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: rows.map((r) => ({
      id: r.id,
      billDate: r.billDate,
      total: num(r.total),
      itemCount: r.itemCount,
      items: r.items,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
