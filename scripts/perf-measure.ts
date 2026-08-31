/**
 * One-off navigation data-path timing. Run:
 *   pnpm exec tsx --env-file=.env.local scripts/perf-measure.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import {
  getActiveItems,
  getRecentItems,
  getTodayBill,
} from "../src/lib/services/billing";
import { getSavedBills } from "../src/lib/services/saved-bills";
import { getStats } from "../src/lib/services/stats";
import { getAdminDashboard } from "../src/lib/services/admin";
import { getProfileData } from "../src/lib/services/profile";

async function main() {
  const [user] = await db.select({ id: users.id }).from(users).limit(1);
  if (!user) {
    console.error("No users in DB — seed first.");
    process.exit(1);
  }
  const userId = user.id;
  console.log("Measuring with user", userId.slice(0, 8) + "...");
  console.log("PG_POOL_MAX=", process.env.PG_POOL_MAX ?? "(default from db module)");

  async function time(label: string, fn: () => Promise<unknown>) {
    const t0 = performance.now();
    await fn();
    const ms = performance.now() - t0;
    console.log(`${label}: ${ms.toFixed(1)}ms`);
    return ms;
  }

  // Warm all pool clients so parallel timings reflect steady-state (not cold TLS).
  const poolMax = Number(process.env.PG_POOL_MAX) || 5;
  await time(`warmup_pool_x${poolMax}`, async () => {
    await Promise.all(
      Array.from({ length: poolMax }, () => getActiveItems()),
    );
  });

  await time("home activeItems", () => getActiveItems());
  await time("home todayBill", () => getTodayBill(userId));
  await time("home recentItems", () => getRecentItems(userId));
  await time("home parallel3", async () => {
    await Promise.all([
      getActiveItems(),
      getTodayBill(userId),
      getRecentItems(userId),
    ]);
  });

  await time("stats getStats", () => getStats(userId));
  await time("stats getStats+todayBill", async () => {
    await Promise.all([getStats(userId), getTodayBill(userId)]);
  });

  await time("activity getSavedBills", () => getSavedBills(userId, 1));
  await time("profile getProfileData", () => getProfileData(userId));
  await time("admin getAdminDashboard", () => getAdminDashboard());

  // Session-like RTT proxy
  const url = process.env.DATABASE_URL!;
  const cleaned = url
    .replace(/([?&])sslmode=[^&]*&?/g, "$1")
    .replace(/([?&])ssl=[^&]*&?/g, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
  const pool = new Pool({
    connectionString: cleaned,
    max: 1,
    ssl: { rejectUnauthorized: false },
  });
  await time("auth_session_3x_serial", async () => {
    for (let i = 0; i < 3; i++) {
      await pool.query(`select 1 from "session" limit 1`);
    }
  });
  await time("auth_session_1x", async () => {
    await pool.query(`select 1 from "session" limit 1`);
  });
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
