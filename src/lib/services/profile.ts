import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { billEntries, savedBills, users } from "@/db/schema";
import { getMostUsed, type MostUsed } from "@/lib/services/stats";
import { APP_TIMEZONE } from "@/lib/timezone";

/**
 * Profile-screen aggregation.
 *
 * Lifetime spend = open {@link billEntries} + finalized {@link savedBills}
 * (saving moves spend from open lines into snapshots). Favorite item reuses
 * the Stats 30-day aggregator. `users.created_at` drives "Member since".
 */

/** Numeric columns come back as strings from Drizzle; coerce for the client. */
const num = (v: string | number | null | undefined): number => Number(v ?? 0);

/** Serializable payload handed to the `<ProfileView />` client component. */
export type ProfileData = {
  /** Lifetime spend across open lines and saved bill snapshots. */
  totalConsumption: number;
  /** Most-tapped item over the trailing 30 days, reused from Stats. */
  favoriteItem: MostUsed | null;
  /** Pre-formatted "Month Year" label, e.g. "June 2023". */
  memberSinceLabel: string;
};

const memberSinceFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  month: "long",
  year: "numeric",
});

/**
 * Gather the Profile screen's three figures in a single batch of parallel
 * queries. Safe to call from a server component.
 */
export async function getProfileData(userId: string): Promise<ProfileData> {
  const [openRow, savedRow, userRow, favoriteItem] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${billEntries.subtotal}), 0)` })
      .from(billEntries)
      .where(eq(billEntries.userId, userId)),
    db
      .select({ total: sql<string>`coalesce(sum(${savedBills.total}), 0)` })
      .from(savedBills)
      .where(eq(savedBills.userId, userId)),
    db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    getMostUsed(userId),
  ]);

  return {
    totalConsumption: num(openRow[0]?.total) + num(savedRow[0]?.total),
    favoriteItem,
    memberSinceLabel: memberSinceFormatter.format(userRow[0]?.createdAt ?? new Date()),
  };
}

/**
 * Persist a new profile picture for the signed-in user.
 *
 * `image` is expected to be a self-contained `data:` URL (resized/encoded on the
 * client) so it needs no external storage backend and renders directly in an
 * `<img>` `src`. Stored verbatim in the existing {@link users.image} text column.
 */
export async function updateProfileImage(userId: string, image: string) {
  await db
    .update(users)
    .set({ image, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
