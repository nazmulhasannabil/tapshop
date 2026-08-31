import { sql } from "drizzle-orm";
import { APP_TIMEZONE } from "@/lib/timezone";

/** `(timezone('Asia/Dhaka', now()))::date` — calendar today in the app TZ. */
export function sqlAppToday() {
  return sql.raw(`(timezone('${APP_TIMEZONE}', now()))::date`);
}

/** Same as {@link sqlAppToday} as text (`YYYY-MM-DD`). */
export function sqlAppTodayText() {
  return sql.raw(`(timezone('${APP_TIMEZONE}', now()))::date::text`);
}

/** `date_trunc(unit, app-local timestamp)::date`. */
export function sqlAppDateTrunc(unit: "week" | "month") {
  return sql.raw(
    `date_trunc('${unit}', timezone('${APP_TIMEZONE}', now()))::date`,
  );
}

/** App-local today minus an interval, as a date (e.g. trailing 30 days). */
export function sqlAppTodayMinus(interval: string) {
  // interval is a fixed literal from call sites (`'30 days'`), not user input.
  return sql.raw(
    `((timezone('${APP_TIMEZONE}', now()))::date - INTERVAL '${interval}')`,
  );
}
