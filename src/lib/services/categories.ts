import { asc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { categories, DEFAULT_CATEGORIES } from "@/db/schema";
import type { ItemCategory } from "@/lib/item-categories";

export class CategoryError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "CategoryError";
  }
}

/** Ensure the three default categories exist (idempotent). */
export async function ensureDefaultCategories(): Promise<void> {
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name })))
    .onConflictDoNothing();
}

/** All categories, A–Z by name. */
export const getCategories = cache(async function getCategories(): Promise<ItemCategory[]> {
  await ensureDefaultCategories();
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
});

/** Create a category; returns existing row if the name already exists (case-insensitive). */
export async function createCategory(
  userId: string,
  name: string,
): Promise<ItemCategory> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CategoryError("INVALID_CATEGORY", "Give the category a name.");
  }

  const [existing] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(sql`lower(${categories.name}) = lower(${trimmed})`)
    .limit(1);

  if (existing) return existing;

  try {
    const [row] = await db
      .insert(categories)
      .values({ name: trimmed, createdBy: userId })
      .returning({ id: categories.id, name: categories.name });
    return row;
  } catch {
    // Race: another insert won the unique name — return that row.
    const [again] = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.name, trimmed))
      .limit(1);
    if (again) return again;
    throw new CategoryError("CATEGORY_CREATE_FAILED", "Couldn't create that category.");
  }
}
