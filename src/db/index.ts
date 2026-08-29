import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Standard PostgreSQL via `pg` — works with any cloud-managed Postgres
 * (Supabase, Railway, Render, RDS, etc.). Use the provider's pooled
 * connection string on Vercel to avoid exhausting connection limits.
 *
 * `casing: "snake_case"` keeps SQL columns aligned with the spec
 * (e.g. JS `unitPrice` → SQL `unit_price`) while we write clean camelCase.
 *
 * The instance is created lazily on first use via a Proxy so that
 * `next build` does NOT require DATABASE_URL to be present (auth/db modules
 * are imported at build time but only touched at request time).
 */
type DB = ReturnType<typeof createDb>;

const globalForPg = globalThis as { pgPool?: Pool };

/** Cloud Postgres hosts (Supabase, etc.) need TLS with relaxed cert verification. */
function isLocalPostgres(connectionString: string) {
  return /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);
}

/**
 * pg 8.23+ parses `sslmode=require` in the URL as verify-full, which rejects
 * Supabase's cert chain. Strip ssl query params and set SSL on the Pool instead.
 */
function resolvePoolConfig(connectionString: string) {
  const cleaned = connectionString
    .replace(/([?&])sslmode=[^&]*&?/g, "$1")
    .replace(/([?&])ssl=[^&]*&?/g, "$1")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");

  return {
    connectionString: cleaned,
    max: 1 as const,
    ssl: isLocalPostgres(connectionString)
      ? undefined
      : ({ rejectUnauthorized: false } as const),
  };
}

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Postgres connection string.",
    );
  }

  const pool =
    globalForPg.pgPool ?? new Pool(resolvePoolConfig(url));

  if (process.env.NODE_ENV !== "production") {
    globalForPg.pgPool = pool;
  }

  return drizzle({ client: pool, schema, casing: "snake_case" });
}

let _db: DB | null = null;

function getDb(): DB {
  if (!_db) _db = createDb();
  return _db;
}

/**
 * Lazy proxy — behaves exactly like the Drizzle instance but only connects
 * (and only validates DATABASE_URL) on the first real query.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop as keyof DB);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
}) as DB;

export type { DB };
