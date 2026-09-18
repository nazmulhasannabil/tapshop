import { and, asc, eq, or, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { categories, DEFAULT_CATEGORIES, SYSTEM_USER_ID, users } from "@/db/schema";
import type { ItemCategory } from "@/lib/item-categories";

export class CategoryError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "CategoryError";
  }
}

/** Shared system defaults + rows owned by this user. */
export function catalogOwnedBy(userId: string) {
  return or(eq(categories.createdBy, userId), eq(categories.createdBy, SYSTEM_USER_ID));
}

async function ensureSystemUser(): Promise<void> {
  await db
    .insert(users)
    .values({
      id: SYSTEM_USER_ID,
      name: "TapShop",
      email: "system@tapshop.local",
      emailVerified: true,
      role: "user",
      isActive: false,
    })
    .onConflictDoNothing();
}

/** Ensure the three default categories exist (idempotent). */
export async function ensureDefaultCategories(): Promise<void> {
  await ensureSystemUser();
  await db
    .insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        createdBy: SYSTEM_USER_ID,
      })),
    )
    .onConflictDoNothing();
}

/** Categories visible to the user: system defaults + their own. */
export const getCategories = cache(async function getCategories(
  userId: string,
): Promise<ItemCategory[]> {
  await ensureDefaultCategories();
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(catalogOwnedBy(userId))
    .orderBy(asc(categories.name));
});

/**
 * Create a category owned by the user.
 * Returns an existing system default or the user's own row on name match.
 */
export async function createCategory(
  userId: string,
  name: string,
): Promise<ItemCategory> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new CategoryError("INVALID_CATEGORY", "Give the category a name.");
  }

  // Prefer shared default if the name matches (case-insensitive).
  const [systemMatch] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(
      and(
        eq(categories.createdBy, SYSTEM_USER_ID),
        sql`lower(${categories.name}) = lower(${trimmed})`,
      ),
    )
    .limit(1);
  if (systemMatch) return systemMatch;

  const [existing] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(
      and(
        eq(categories.createdBy, userId),
        sql`lower(${categories.name}) = lower(${trimmed})`,
      ),
    )
    .limit(1);

  if (existing) return existing;

  try {
    const [row] = await db
      .insert(categories)
      .values({ name: trimmed, createdBy: userId })
      .returning({ id: categories.id, name: categories.name });
    return row;
  } catch {
    // Race: another insert for this user won the unique name — return that row.
    const [again] = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(
        and(
          eq(categories.createdBy, userId),
          sql`lower(${categories.name}) = lower(${trimmed})`,
        ),
      )
      .limit(1);
    if (again) return again;
    throw new CategoryError("CATEGORY_CREATE_FAILED", "Couldn't create that category.");
  }
}
