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
