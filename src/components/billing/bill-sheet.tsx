"use client";

import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/constants";
import { displayedQty, useBillLineList, useBillTotals } from "@/stores/bill-store";
import { useBill } from "@/hooks/use-bill";
import { useSavedBill } from "@/hooks/use-saved-bills";
import { useSession } from "@/lib/auth/client";
import { AnimatedTotal } from "./animated-total";
import { EmptyState } from "./empty-state";

export function BillSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const lines = useBillLineList();
  const { count, total } = useBillTotals();
  const { addItem, decreaseItem, removeEntry } = useBill();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const { saveBill } = useSavedBill(userId);
  const [saving, setSaving] = useState(false);

  const canSave = count > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const res = await saveBill();
    setSaving(false);
    if (res.ok) onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-3xl p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-center text-lg">Today&apos;s Bill</SheetTitle>
          <SheetDescription className="text-center">
            {count > 0
              ? `${count} ${count === 1 ? "item" : "items"}`
              : "Tap items on the home screen to build your bill."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {lines.length === 0 ? (
            <EmptyState
              icon="🧾"
              title="No bites yet"
              description="Tap an item on the home screen and watch it appear here."
              className="mt-6 border-0"
            />
          ) : (
            lines.map((entry) => {
              const qty = displayedQty(entry);
              return (
                <div
                  key={entry.itemId}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                >
                  <span className="text-2xl leading-none">{entry.icon ?? "🍽️"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.name}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {qty} × {formatCurrency(entry.unitPrice)} ={" "}
                      {formatCurrency(qty * entry.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StepperButton
                      label={`Remove one ${entry.name}`}
                      onClick={() => decreaseItem(entry.itemId)}
                    >
                      <Minus className="size-4" />
                    </StepperButton>
                    <span className="tnum w-7 text-center text-sm font-semibold">{qty}</span>
                    <StepperButton
                      label={`Add one ${entry.name}`}
                      onClick={() =>
                        addItem({
                          id: entry.itemId,
                          name: entry.name,
                          icon: entry.icon,
                          price: entry.unitPrice,
                        })
                      }
                    >
                      <Plus className="size-4" />
                    </StepperButton>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.itemId)}
                    aria-label={`Remove ${entry.name} from bill`}
                    className="ml-1 flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <SheetFooter className="border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <AnimatedTotal
                value={total}
                className="text-2xl font-bold tracking-tight text-primary"
              />
            </div>
            <Button
              type="button"
              size="lg"
              className="h-11 w-full text-base"
              disabled={!canSave}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save Bill"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function StepperButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-primary/10 hover:text-primary active:scale-90"
    >
      {children}
    </button>
  );
}
