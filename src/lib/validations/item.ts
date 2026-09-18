import { z } from "zod";

/** Body shape for POST /api/items (create item). */
export const createItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give it a name.")
    .max(100, "Keep the name under 100 characters."),
  price: z
    .number()
    .positive("Price must be greater than 0.")
    .max(100000, "That price looks off."),
  icon: z.string().trim().max(200, "Icon path is too long.").optional().nullable(),
  categoryId: z.string().trim().min(1, "Pick a category."),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

/** Body shape for PATCH /api/items/[id] (update item). */
export const updateItemSchema = createItemSchema;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

/** Body shape for POST /api/categories (create category). */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the category a name.")
    .max(40, "Keep the category name under 40 characters."),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
