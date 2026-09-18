"use client";

import { BillItemCard } from "./bill-item-card";
import { EmptyState } from "./empty-state";
import type { CatalogItem } from "@/types/bill";

export function ItemGrid({
  items,
  onItemTap,
  onEdit,
  onDelete,
}: {
  items: CatalogItem[];
  onItemTap?: (item: CatalogItem) => void;
  onEdit?: (item: CatalogItem) => void;
  onDelete?: (item: CatalogItem) => void | Promise<void>;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="🧁"
        title="No items yet"
        description='Tap "+ New Items" to create your first snack or drink.'
      />
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <BillItemCard
          key={item.id}
          item={item}
          onTap={onItemTap}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
