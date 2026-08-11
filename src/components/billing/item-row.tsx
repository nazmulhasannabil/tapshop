"use client";

import { BillItemCard } from "./bill-item-card";
import type { CatalogItem } from "@/types/bill";

/** Horizontal scroller of compact item cards (Recent / Go-To's). */
export function ItemRow({
  items,
  onItemTap,
}: {
  items: CatalogItem[];
  onItemTap?: (item: CatalogItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {items.map((item) => (
        <BillItemCard key={item.id} item={item} compact onTap={onItemTap} />
      ))}
    </div>
  );
}
