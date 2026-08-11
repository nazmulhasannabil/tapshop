"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { useBill } from "@/hooks/use-bill";
import type { CatalogItem } from "@/types/bill";

const addFormSchema = z.object({
  name: z.string().trim().min(1, "Give it a name.").max(100),
  price: z
    .string()
    .trim()
    .min(1, "Enter a price.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Price must be greater than 0.")
    .refine((v) => Number(v) <= 100000, "That price looks off."),
  icon: z.string().trim().max(10, "Keep the icon short.").optional(),
});
type AddFormValues = z.infer<typeof addFormSchema>;

const EMOJI_SUGGESTIONS = ["☕", "🥤", "🍪", "🍔", "🥪", "🍜", "🍟", "🍰", "🧃", "🥚"];

export function AddItemSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (item: CatalogItem) => void;
}) {
  const { createItem } = useBill();
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddFormValues>({
    resolver: zodResolver(addFormSchema),
    defaultValues: { name: "", price: "", icon: "" },
  });

  // Reset the form whenever the sheet is closed.
  useEffect(() => {
    if (!open) reset({ name: "", price: "", icon: "" });
  }, [open, reset]);

  const iconValue = watch("icon");

  async function onSubmit(values: AddFormValues) {
    setPending(true);
    const res = await createItem({
      name: values.name,
      price: Number(values.price),
      icon: values.icon || null,
    });
    setPending(false);
    if (res.ok) {
      toast.success(`${res.data.name} added 🎉`);
      onCreate(res.data);
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 rounded-t-3xl p-0">
        <SheetHeader className="border-b">
          <SheetTitle className="text-center text-lg">Add a new item</SheetTitle>
          <SheetDescription className="text-center">
            One tap and it&apos;s ready to use.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 px-4 py-5">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item name</Label>
              <Input
                id="item-name"
                placeholder="e.g. Chicken Sandwich"
                autoComplete="off"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-price">Price (৳)</Label>
              <Input
                id="item-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="120"
                aria-invalid={!!errors.price}
                {...register("price")}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-icon">Icon (optional)</Label>
              <Input
                id="item-icon"
                placeholder="🍔"
                maxLength={10}
                className="w-20 text-center text-xl"
                aria-invalid={!!errors.icon}
                {...register("icon")}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {EMOJI_SUGGESTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue("icon", emoji, { shouldValidate: true })}
                    className={`flex size-9 items-center justify-center rounded-full text-lg ring-1 transition ${
                      iconValue === emoji
                        ? "bg-primary/10 ring-primary"
                        : "ring-border hover:bg-muted"
                    }`}
                    aria-label={`Use ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t">
            <Button type="submit" size="lg" disabled={pending} className="h-11 w-full text-base">
              {pending && <Loader2 className="animate-spin" />}
              {pending ? "Creating…" : "Create item"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
