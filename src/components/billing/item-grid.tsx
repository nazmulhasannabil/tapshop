"use client";

import { BillItemCard } from "./bill-item-card";
import { EmptyState } from "./empty-state";
import type { CatalogItem } from "@/types/bill";

export function ItemGrid({
  items,
  onItemTap,
}: {
  items: CatalogItem[];
  onItemTap?: (item: CatalogItem) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="🧁"
        title="No items yet"
        description='Tap "+ Add Item" to create your first snack or drink.'
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => (
        <BillItemCard key={item.id} item={item} onTap={onItemTap} />
      ))}
    </div>
  );
}
