/** Shapes shared between server and client. */

/** An item as shown in the catalog grid. */
export type CatalogItem = {
  id: string;
  name: string;
  /** Current price (numbers; `items.price` is numeric in the DB). */
  price: number;
  icon: string | null;
};

/** One line on today's bill. */
export type BillLine = {
  itemId: string;
  name: string;
  icon: string | null;
  /** Price snapshot captured when the line was first created today. */
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

/**
 * One item-per-day entry in the activity feed (a row from `bill_entries`).
 * Taps are aggregated per (user, item, day), so a single entry may represent
 * several taps of the same item on the same day.
 */
export type ActivityEntry = {
  id: string;
  itemId: string;
  name: string;
  icon: string | null;
  /** Cumulative taps for this item on this day. */
  quantity: number;
  /** Price snapshot captured on the first tap of the day. */
  unitPrice: number;
  subtotal: number;
  /** ISO timestamp — first tap of the day. */
  consumedAt: string;
  /** ISO timestamp — most recent tap (drives feed ordering + "time ago"). */
  updatedAt: string;
};

/** Standard JSON envelope for all /api mutations. */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Result of an add-tap: authoritative quantity + snapshot price + subtotal. */
export type AddItemResult = {
  itemId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

/** Result of a decrease: authoritative quantity (0 when the line is removed). */
export type DecreaseItemResult = {
  itemId: string;
  quantity: number;
  deleted: boolean;
};

/* -------------------------------- Saved bills ------------------------------ */

/** One line of a saved bill (frozen snapshot of a `bill_entries` line). */
export type SavedBillItem = {
  name: string;
  icon: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

/** A finalized/saved bill, including its full item snapshot. */
export type SavedBill = {
  id: string;
  /** YYYY-MM-DD — the day this bill is for. */
  billDate: string;
  total: number;
  itemCount: number;
  items: SavedBillItem[];
  /** ISO timestamp — when the bill was saved. */
  createdAt: string;
};

/** Summary shape used for table rows (no item breakdown). */
export type SavedBillSummary = {
  id: string;
  billDate: string;
  total: number;
  itemCount: number;
  createdAt: string;
};

/** Result returned after saving a bill. */
export type SaveBillResult = SavedBillSummary;

/** A page of results from a paginated query. */
export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
