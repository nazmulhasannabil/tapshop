"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEBT_DIRECTION } from "@/lib/social-constants";
import { todayKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCreateDebt } from "@/hooks/queries/use-debts";
import type { FriendUser } from "@/lib/services/friends";
import type { DebtDto } from "@/lib/services/debts";
import type { ApiResult } from "@/types/bill";

const addDebtFormSchema = z.object({
  direction: z.enum([DEBT_DIRECTION.THEY_OWE_ME, DEBT_DIRECTION.I_OWE_THEM]),
  counterpartyName: z.string().trim().min(1, "Who is this with?").max(100),
  amount: z
    .string()
    .trim()
    .min(1, "Enter an amount.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Amount must be greater than 0."),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  note: z.string().trim().max(500).optional(),
});
type AddDebtFormValues = z.infer<typeof addDebtFormSchema>;

export function AddDebtSheet({
  open,
  onOpenChange,
  userId,
  onCreated,
  onAddFriend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCreated?: (debt: DebtDto) => void;
  onAddFriend: () => void;
}) {
  const createDebt = useCreateDebt(userId);
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [suggestions, setSuggestions] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddDebtFormValues>({
    resolver: zodResolver(addDebtFormSchema),
    defaultValues: {
      direction: DEBT_DIRECTION.THEY_OWE_ME,
      counterpartyName: "",
      amount: "",
      occurredOn: todayKey(),
      note: "",
    },
  });

  const direction = watch("direction");
  const nameValue = watch("counterpartyName");

  useEffect(() => {
    if (!open) {
      reset({
        direction: DEBT_DIRECTION.THEY_OWE_ME,
        counterpartyName: "",
        amount: "",
        occurredOn: todayKey(),
        note: "",
      });
      setSelectedFriend(null);
      setSuggestions([]);
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const q = nameValue?.trim() ?? "";
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    if (selectedFriend && selectedFriend.name === q) {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as ApiResult<FriendUser[]>;
        if (json.ok) setSuggestions(json.data);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(handle);
  }, [nameValue, open, selectedFriend]);

  const directionOptions = useMemo(
    () =>
      [
        { value: DEBT_DIRECTION.THEY_OWE_ME, label: "They owe me" },
        { value: DEBT_DIRECTION.I_OWE_THEM, label: "I owe them" },
      ] as const,
    [],
  );

  async function onSubmit(values: AddDebtFormValues) {
    try {
      const debt = await createDebt.mutateAsync({
        direction: values.direction,
        counterpartyName: values.counterpartyName,
        counterpartyUserId: selectedFriend?.id ?? null,
        amount: Number(values.amount),
        occurredOn: values.occurredOn,
        note: values.note || null,
      });
      toast.success("Debt saved");
      onCreated?.(debt);
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save debt.");
    }
  }

  function pickFriend(friend: FriendUser) {
    setSelectedFriend(friend);
    setValue("counterpartyName", friend.name, { shouldValidate: true });
    setSuggestions([]);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-center text-lg">Add debt</SheetTitle>
          <SheetDescription className="text-center">
            Track money you lent or borrowed.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 px-4 py-5">
            <div className="space-y-2">
              <Label>Direction</Label>
              <div className="grid grid-cols-2 gap-2">
                {directionOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("direction", opt.value, { shouldValidate: true })}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition",
                      direction === opt.value
                        ? "bg-primary/10 text-primary ring-primary"
                        : "bg-card text-foreground ring-border hover:bg-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="debt-person">Person</Label>
                <button
                  type="button"
                  onClick={onAddFriend}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <UserPlus className="size-3.5" />
                  Add friend
                </button>
              </div>
              <Input
                id="debt-person"
                placeholder="Start typing a friend name…"
                autoComplete="off"
                aria-invalid={!!errors.counterpartyName}
                {...register("counterpartyName", {
                  onChange: () => setSelectedFriend(null),
                })}
              />
              {errors.counterpartyName && (
                <p className="text-xs text-destructive">{errors.counterpartyName.message}</p>
              )}
              {selectedFriend && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Linked to friend · {selectedFriend.email}
                </p>
              )}
              {(suggestions.length > 0 || searching) && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-border bg-popover shadow-lg">
                  {searching && suggestions.length === 0 && (
                    <li className="px-3 py-2 text-xs text-muted-foreground">Searching…</li>
                  )}
                  {suggestions.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted"
                        onClick={() => pickFriend(f)}
                      >
                        <span className="text-sm font-medium">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{f.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-amount">Amount (৳)</Label>
              <Input
                id="debt-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="1000"
                aria-invalid={!!errors.amount}
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-date">Date</Label>
              <Input
                id="debt-date"
                type="date"
                aria-invalid={!!errors.occurredOn}
                {...register("occurredOn")}
              />
              {errors.occurredOn && (
                <p className="text-xs text-destructive">{errors.occurredOn.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="debt-note">Note (optional)</Label>
              <Input
                id="debt-note"
                placeholder="Lunch, rent…"
                {...register("note")}
              />
            </div>
          </div>

          <SheetFooter className="border-t">
            <Button type="submit" size="lg" disabled={createDebt.isPending} className="h-11 w-full text-base">
              {createDebt.isPending && <Loader2 className="animate-spin" />}
              {createDebt.isPending ? "Saving…" : "Save debt"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
