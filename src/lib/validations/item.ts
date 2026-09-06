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
  icon: z.string().trim().max(10, "Use a short emoji or icon.").optional().nullable(),
  categoryId: z.string().trim().min(1, "Pick a category."),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

/** Body shape for POST /api/categories (create category). */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the category a name.")
    .max(40, "Keep the category name under 40 characters."),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
