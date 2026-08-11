/**
 * Seed script.
 *
 * 1. Creates a non-loginable "system" user that owns the default shop items.
 * 2. Seeds those items only if the table is empty.
 * 3. Provisions two demo accounts (created via Better Auth so passwords are
 *    hashed correctly), forcing the admin role on the admin demo so it works
 *    even without ADMIN_EMAILS configured.
 *
 * Idempotent — safe to re-run.
 *
 * Run with: pnpm db:seed   (after pnpm db:push | db:migrate)
 *
 * Demo logins:
 *   User:  demo@tapshop.com   / password123
 *   Admin: admin@tapshop.com  / password123
 */
import { existsSync } from "node:fs";
import { config } from "dotenv";
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) config({ path: file });
}

import { eq } from "drizzle-orm";
import { auth } from "../lib/auth/auth";
import { db } from "./index";
import { items, users } from "./schema";

/** Fixed id for the system user that owns seeded items. */
const SYSTEM_USER_ID = "00000000-0000-4000-8000-000000000000";

const SEED_ITEMS = [
  { name: "Tea", price: "10", icon: "☕" },
  { name: "Coffee", price: "25", icon: "☕" },
  { name: "Soft Drink", price: "30", icon: "🥤" },
  { name: "Biscuit", price: "20", icon: "🍪" },
  { name: "Burger", price: "80", icon: "🍔" },
  { name: "Sandwich", price: "120", icon: "🥪" },
  { name: "Noodles", price: "60", icon: "🍜" },
  { name: "Fries", price: "50", icon: "🍟" },
];

const DEMO_ACCOUNTS = [
  { name: "Demo", email: "demo@tapshop.com", password: "password123", role: "user" as const },
  { name: "admin", email: "admin@tapshop.com", password: "password123", role: "admin" as const },
];

async function ensureSystemUser() {
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

async function seedItemsIfEmpty() {
  const existing = await db.select({ id: items.id }).from(items).limit(1);
  if (existing.length > 0) {
    console.log("  Items already present — skipping item seed.");
    return;
  }
  await db.insert(items).values(
    SEED_ITEMS.map((item) => ({
      name: item.name,
      price: item.price,
      icon: item.icon,
      createdBy: SYSTEM_USER_ID,
    })),
  );
  console.log(`  ✅ Seeded ${SEED_ITEMS.length} default items.`);
}

async function provisionAccount(account: {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}) {
  let lastError: unknown = null;
  try {
    await auth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: account.password,
      },
    });
  } catch (error) {
    // Usually "user already exists" on re-runs — resolved by the lookup below.
    lastError = error;
  }

  const [found] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, account.email))
    .limit(1);

  if (!found) {
    throw lastError ?? new Error(`Could not provision ${account.email}`);
  }

  // Force the role so the admin demo is an admin regardless of ADMIN_EMAILS env.
  await db.update(users).set({ role: account.role }).where(eq(users.id, found.id));

  console.log(
    `  ✅ ${account.role.toUpperCase()} ready: ${account.email} / ${account.password}`,
  );
}

async function main() {
  console.log("→ Ensuring system user exists…");
  await ensureSystemUser();

  console.log("→ Seeding items…");
  await seedItemsIfEmpty();

  console.log("→ Provisioning demo accounts…");
  for (const account of DEMO_ACCOUNTS) {
    await provisionAccount(account);
  }

  console.log("\n✅ Seed complete.");
  console.log("   Login → demo@tapshop.com / password123");
  console.log("   Admin → admin@tapshop.com / password123");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
