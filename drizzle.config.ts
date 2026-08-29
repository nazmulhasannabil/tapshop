import { existsSync } from "node:fs";
import { config } from "dotenv";

// Load Next-style env files so drizzle-kit CLI (generate/migrate/seed) can read
// DATABASE_URL. `.env.local` is preferred, then `.env`.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) config({ path: file });
}

import { defineConfig } from "drizzle-kit";

function cleanDatabaseUrl(connectionString: string) {
  return connectionString
    .replace(/([?&])sslmode=[^&]*&?/g, "$1")
    .replace(/([?&])ssl=[^&]*&?/g, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

const databaseUrl = cleanDatabaseUrl(process.env.DATABASE_URL!);
const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(databaseUrl);

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  },
  verbose: true,
  strict: true,
});
