/**
 * Server-only environment access.
 *
 * Secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`) are read directly at the call
 * site (`db`, `auth`) so they are never aggregated into a shared module that a
 * client bundle could accidentally import. Only non-secret, derived values are
 * exported from here.
 */

/** Comma-separated allowlist of emails that auto-become ADMIN on signup. */
function parseAdminEmails(value: string | undefined): Set<string> {
  if (!value) return new Set<string>();
  return new Set(
    value
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const nodeEnv = process.env.NODE_ENV ?? "development";
export const isProd = nodeEnv === "production";
export const isDev = nodeEnv === "development";

/** Emails whose signup should be promoted to ADMIN role. */
export const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);

/**
 * Public app origin (used to build absolute Better Auth URLs).
 *
 * In production, a stale `BETTER_AUTH_URL` pointing at localhost is silently
 * ignored so that the `VERCEL_URL` fallback can take over.  This prevents the
 * common "Invalid origin" 403 that happens when a dev value leaks into the
 * Vercel environment.
 */
export const betterAuthUrl = isProd
  ? (process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes("localhost")
      ? process.env.BETTER_AUTH_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined)
  : process.env.BETTER_AUTH_URL || undefined;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails.has(email.trim().toLowerCase());
}
