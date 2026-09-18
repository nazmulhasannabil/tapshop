"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { useBill } from "@/hooks/use-bill";
import type { CatalogItem } from "@/types/bill";
import { ItemVisual } from "./item-visual";

export function BillItemCard({
  item,
  compact = false,
  onTap,
  onEdit,
  onDelete,
}: {
  item: CatalogItem;
  compact?: boolean;
  onTap?: (item: CatalogItem) => void;
  onEdit?: (item: CatalogItem) => void;
  onDelete?: (item: CatalogItem) => void | Promise<void>;
}) {
  const { addItem } = useBill();
  const [pop, setPop] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const reactId = useId();

  function handleTap() {
    addItem(item);
    onTap?.(item);
    setPop((p) => p + 1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTap();
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item);
    } finally {
      setDeleting(false);
    }
  }

  const menu =
    onEdit || onDelete ? (
      <ItemMenu
        busy={deleting}
        onEdit={onEdit ? () => onEdit(item) : undefined}
        onDelete={onDelete ? handleDelete : undefined}
      />
    ) : null;

  if (compact) {
    return (
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`Add one ${item.name}, ${formatCurrency(item.price)}`}
        onClick={handleTap}
        onKeyDown={handleKeyDown}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="group relative flex w-[116px] shrink-0 select-none flex-col overflow-hidden rounded-lg border border-border bg-card p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative flex h-16 items-center justify-center overflow-hidden rounded-md bg-slate-950">
          <ItemVisual
            icon={item.icon}
            name={item.name}
            className="absolute inset-0"
            emojiClassName="relative flex size-full items-center justify-center text-2xl"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b101d]/80 to-transparent px-1.5 pb-1 pt-4">
            <span className="line-clamp-1 text-[11px] font-bold text-white">{item.name}</span>
          </div>
        </div>
        <span className="tnum mt-1.5 text-[11px] font-extrabold text-primary">
          {formatCurrency(item.price)}
        </span>
        <AnimatePresence>
          {pop > 0 && (
            <motion.span
              key={`${reactId}-${pop}`}
              initial={{ opacity: 0, y: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 1, 0], y: [0, -6, -26], scale: [0.7, 1.1, 1] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-primary"
            >
              +1
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group relative flex w-full select-none flex-col rounded-lg border border-border bg-card p-1.5 shadow-sm",
      )}
    >
      <button
        type="button"
        aria-label={`Add one ${item.name}, ${formatCurrency(item.price)}`}
        onClick={handleTap}
        className="relative w-full overflow-hidden rounded-md bg-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative flex aspect-square items-center justify-center">
          <ItemVisual
            icon={item.icon}
            name={item.name}
            className="absolute inset-0"
            emojiClassName="relative flex size-full items-center justify-center text-4xl"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b101d]/80 via-transparent to-transparent" />
        <div className="absolute inset-x-1 bottom-1 overflow-hidden">
          <span className="line-clamp-1 text-[11px] font-bold tracking-tight text-white">
            {item.name}
          </span>
        </div>
      </button>

      <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
        <div className="flex min-w-0 items-center gap-1">
          {menu}
          <span className="tnum rounded border border-emerald-500/25 bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-extrabold tracking-tight text-primary">
            {formatCurrency(item.price)}
          </span>
        </div>
        <button
          type="button"
          aria-label={`Add ${item.name}`}
          onClick={handleTap}
          className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm transition hover:bg-emerald-400 active:scale-90"
        >
          <Plus className="size-3" strokeWidth={3} />
        </button>
      </div>

      <AnimatePresence>
        {pop > 0 && (
          <motion.span
            key={`${reactId}-${pop}`}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, -6, -26], scale: [0.7, 1.1, 1] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-base font-bold text-primary"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ItemMenu({
  busy,
  onEdit,
  onDelete,
}: {
  busy: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="Item options"
        aria-expanded={open}
        disabled={busy}
        className="flex size-5 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <MoreVertical className="size-3.5" strokeWidth={2.5} />
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1 min-w-32 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-md">
          {onEdit ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil className="size-3.5" />
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
