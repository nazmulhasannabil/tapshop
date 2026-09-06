"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
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
import type { ItemCategory } from "@/lib/item-categories";
import { cn } from "@/lib/utils";
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
  categoryId: z.string().min(1, "Pick a category."),
});

type AddFormFields = {
  name: string;
  price: string;
  icon?: string;
  categoryId: string;
};

const EMOJI_SUGGESTIONS = ["☕", "🥤", "🍪", "🍔", "🥪", "🍜", "🍟", "🍰", "🧃", "🥚"];

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  "md:text-sm dark:bg-input/30",
);

export function AddItemSheet({
  open,
  onOpenChange,
  onCreate,
  categories,
  onCategoryCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (item: CatalogItem) => void;
  categories: ItemCategory[];
  onCategoryCreate: (category: ItemCategory) => void;
}) {
  const { createItem, createCategory } = useBill();
  const [pending, setPending] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddFormFields>({
    resolver: zodResolver(addFormSchema) as Resolver<AddFormFields>,
    defaultValues: { name: "", price: "", icon: "", categoryId: "" },
  });

  // Reset the form whenever the sheet is closed.
  useEffect(() => {
    if (!open) {
      reset({ name: "", price: "", icon: "", categoryId: "" });
      setShowNewCategory(false);
      setNewCategoryName("");
    }
  }, [open, reset]);

  const iconValue = watch("icon");

  async function onSubmit(values: AddFormFields) {
    setPending(true);
    const res = await createItem({
      name: values.name,
      price: Number(values.price),
      icon: values.icon || null,
      categoryId: values.categoryId,
    });
    setPending(false);
    if (res.ok) {
      toast.success(`${res.data.name} added 🎉`);
      onCreate(res.data);
      onOpenChange(false);
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Give the category a name.");
      return;
    }
    setCreatingCategory(true);
    const res = await createCategory(name);
    setCreatingCategory(false);
    if (res.ok) {
      onCategoryCreate(res.data);
      setValue("categoryId", res.data.id, { shouldValidate: true });
      setNewCategoryName("");
      setShowNewCategory(false);
      toast.success(`${res.data.name} category ready`);
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="item-category">Category</Label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Plus className="size-3.5" />
                  {showNewCategory ? "Cancel" : "New category"}
                </button>
              </div>

              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Grocery, Hangout, Party…"
                    maxLength={40}
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={creatingCategory}
                    onClick={handleCreateCategory}
                    className="shrink-0 rounded-xl"
                  >
                    {creatingCategory ? <Loader2 className="animate-spin" /> : "Save"}
                  </Button>
                </div>
              ) : null}

              <select
                id="item-category"
                aria-invalid={!!errors.categoryId}
                className={selectClassName}
                {...register("categoryId")}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">{errors.categoryId.message}</p>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Categories group items so you can filter the Home list faster. Start with
                Grocery, Hangout, or Party — or create your own. A category is required
                before you can add the item.
              </p>
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
                    className={`flex size-9 items-center justify-center rounded-full text-lg transition ${
                      iconValue === emoji
                        ? "bg-accent ring-2 ring-primary"
                        : "bg-muted/60 ring-1 ring-border hover:bg-accent"
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
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="h-12 w-full rounded-xl text-base font-semibold"
            >
              {pending && <Loader2 className="animate-spin" />}
              {pending ? "Creating…" : "Create item"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
