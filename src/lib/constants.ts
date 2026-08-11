/** App-wide constants and formatting helpers. */

export const APP_NAME = "TapShop";

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

/** The `consumed_at` bucket key used to group a user's "today" bill. */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}
