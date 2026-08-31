/**
 * App calendar timezone for bill days / stats "today".
 *
 * Supabase (and most hosted Postgres) runs in UTC, so bare `CURRENT_DATE`
 * rolls over at UTC midnight — hours ahead of Bangladesh. Prefer
 * {@link ymdInAppTimezone} on the server/JS side and the SQL helpers in
 * `@/lib/timezone-sql` for day-bucket queries.
 */
export const APP_TIMEZONE = (() => {
  const raw = process.env.APP_TIMEZONE?.trim() || "Asia/Dhaka";
  if (!/^[A-Za-z0-9_+\-/]+$/.test(raw)) {
    throw new Error(`Invalid APP_TIMEZONE "${raw}". Use an IANA name like Asia/Dhaka.`);
  }
  return raw;
})();

/** Calendar `YYYY-MM-DD` for an instant in the app timezone. */
export function ymdInAppTimezone(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
