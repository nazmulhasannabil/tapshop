import { ymdInAppTimezone } from "@/lib/timezone";

/** App-wide constants and formatting helpers. */

export const APP_NAME = "TapShop";

export const APP_MOTTO = "Add your bill in a single tap";

/** Cookie set after the first onboarding splash so repeat visits skip it. */
export const ONBOARDING_COOKIE = "tapshop_onboarding_done";

/**
 * Default daily spending target (৳) used by the home screen's "Today's Bill"
 * progress bar. Purely a client-side visual reference — not stored or enforced.
 */
export const DEFAULT_DAILY_TARGET = 500;

/** Rows per page on the Activity saved-bills table. */
export const SAVED_BILLS_PAGE_SIZE = 10;

/**
 * Format an amount as Bangladeshi Taka with the ৳ symbol.
 * Uses manual symbol prefix + locale grouping so it renders consistently
 * regardless of the host's ICU data.
 *
 * @example formatCurrency(240)   // "৳240"
 * @example formatCurrency(80.5)  // "৳80.5"
 */
export function formatCurrency(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `৳${formatted}`;
}

/** Relative time label like "2m ago", simplified for the activity feed. */
export function formatRelativeTime(from: Date | string, now: Date = new Date()): string {
  const date = typeof from === "string" ? new Date(from) : from;
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(days / 365);
  return `${years}y ago`;
}

/** Calendar `YYYY-MM-DD` for an instant in the app timezone (not UTC). */
export function todayKey(now: Date = new Date()): string {
  return ymdInAppTimezone(now);
}

/** Format a `YYYY-MM-DD` bill date without UTC parse shifting the day. */
export function formatYmdDate(
  ymd: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  // Construct in local calendar space; do not parse as UTC midnight.
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}
