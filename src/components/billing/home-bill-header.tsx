"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, LayoutDashboard, ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  useNotificationState,
  useNotificationStore,
  type Notification,
} from "@/stores/notification-store";
import { AnimatedTotal } from "@/components/billing/animated-total";

/**
 * Home-only hero: green brand bar + Today's Bill summary as one composition.
 * Other authenticated screens no longer mount a global AppHeader.
 */
export function HomeBillHeader({
  isAdmin,
  count,
  total,
  progressPct,
  onViewBill,
}: {
  isAdmin?: boolean;
  count: number;
  total: number;
  progressPct: number;
  onViewBill: () => void;
}) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { notifications, readIds } = useNotificationState();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const unread = notifications.filter((n) => !readIds.has(n.id));
  const unreadCount = unread.length;
  const hasItems = count > 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="relative -mt-[env(safe-area-inset-top)] overflow-hidden rounded-b-3xl bg-primary pt-[env(safe-area-inset-top)] text-primary-foreground">
      {/* Soft decorative wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full bg-primary-foreground/10"
      />

      <div className="relative mx-auto w-full max-w-md px-4 pb-7 pt-2">
        {/* Brand row */}
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
            {isAdmin && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary-foreground/25 active:scale-95"
              >
                <LayoutDashboard className="size-3" />
                Admin
              </Link>
            )}
          </div>

          <div className="relative">
            <button
              ref={bellRef}
              type="button"
              aria-label="Notifications"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative flex size-9 items-center justify-center rounded-full bg-primary-foreground/15 text-primary-foreground transition hover:bg-primary-foreground/25 active:scale-90"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-primary"
                />
              )}
            </button>

            {open &&
              createPortal(
                <NotificationMenu
                  anchor={bellRef.current}
                  notifications={notifications}
                  readIds={readIds}
                  unreadCount={unreadCount}
                  onClose={() => setOpen(false)}
                  onMarkAllRead={markAllRead}
                />,
                document.body,
              )}
          </div>
        </div>

        {/* Today's Bill summary — same green surface */}
        <section aria-label="Today's bill" className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">
              Today&apos;s Bill
            </p>
            <span className="rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              {count} {count === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-1 flex items-end justify-between gap-3">
            <AnimatedTotal
              value={total}
              className="block text-3xl font-bold tracking-tight text-primary-foreground"
            />
            <button
              type="button"
              onClick={hasItems ? onViewBill : undefined}
              disabled={!hasItems}
              aria-label="View bill"
              className={cn(
                "mb-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-foreground px-3.5 py-2 text-sm font-semibold text-primary shadow-sm transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                hasItems
                  ? "hover:bg-primary-foreground/90 active:scale-95"
                  : "pointer-events-none opacity-50",
              )}
            >
              View Bill
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/20"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label={`Spent ${progressPct}% of daily target`}
          >
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </section>
      </div>
    </header>
  );
}

function NotificationMenu({
  anchor,
  notifications,
  readIds,
  unreadCount,
  onClose,
  onMarkAllRead,
}: {
  anchor: HTMLButtonElement | null;
  notifications: Notification[];
  readIds: Set<string>;
  unreadCount: number;
  onClose: () => void;
  onMarkAllRead: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, right: 16 });

  useEffect(() => {
    function place() {
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  return (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default"
      />
      <div
        role="dialog"
        aria-label="Notifications"
        className="fixed z-[80] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-card text-card-foreground shadow-xl ring-1 ring-foreground/5"
        style={{ top: pos.top, right: pos.right }}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:opacity-80"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <ul className="max-h-[min(60vh,24rem)] divide-y divide-border/60 overflow-y-auto">
          {notifications.map((n) => {
            const isUnread = !readIds.has(n.id);
            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 transition",
                  isUnread ? "bg-primary/5" : "bg-card",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                  {n.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                    {isUnread && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">{n.time}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {notifications.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No notifications yet.
          </div>
        )}
      </div>
    </>
  );
}
