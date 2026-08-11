import { existsSync } from "node:fs";
import { config } from "dotenv";

// Load Next-style env files so drizzle-kit CLI (generate/migrate/seed) can read
// DATABASE_URL. `.env.local` is preferred, then `.env`.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) config({ path: file });
}

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
