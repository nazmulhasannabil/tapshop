"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, LayoutDashboard, ArrowRight, User } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  useNotificationState,
  useNotificationStore,
  type Notification,
} from "@/stores/notification-store";
import { AnimatedTotal } from "@/components/billing/animated-total";
import { BrandMark } from "@/components/auth/tapshop-logo";

/**
 * Home header: brand row + Today's Bill emerald card (Figma dark theme).
 */
export function HomeBillHeader({
  isAdmin,
  userName,
  count,
  total,
  onViewBill,
}: {
  isAdmin?: boolean;
  userName?: string | null;
  count: number;
  total: number;
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
  const displayName = userName?.trim() || "You";

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
    <header className="relative mx-auto w-full max-w-md px-5 pt-1">
      {/* Brand row */}
      <div className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-9" />
          <h1 className="text-xl font-bold tracking-tight text-white">{APP_NAME}</h1>
          {isAdmin && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground active:scale-95"
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
            className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card text-slate-300 transition hover:text-white active:scale-90"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute right-2 top-2 size-2.5 rounded-full bg-red-500 ring-2 ring-[#0b101d]"
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

      {/* Today's Bill card */}
      <section
        aria-label="Today's bill"
        className="relative mt-1 overflow-hidden rounded-2xl border border-emerald-500/25 p-[17px] shadow-[0_20px_25px_-5px_rgba(2,44,34,0.4),0_8px_10px_-6px_rgba(2,44,34,0.4)]"
        style={{
          backgroundImage:
            "linear-gradient(156deg, rgb(6, 78, 59) 0%, rgb(4, 54, 40) 50%, rgb(2, 35, 27) 100%)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-emerald-400/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-32 rounded-full bg-teal-400/10 blur-xl"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.55px] text-emerald-300/80">
              Today&apos;s Bill
            </p>
            <AnimatedTotal
              value={total}
              className="mt-1 block text-4xl font-black tracking-tight text-white"
            />
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2.5">
            <span className="rounded-full bg-[rgba(2,44,34,0.8)] px-3 py-1 text-xs font-semibold text-emerald-300">
              {count} {count === 1 ? "item" : "items"}
            </span>
            <button
              type="button"
              onClick={hasItems ? onViewBill : undefined}
              disabled={!hasItems}
              aria-label="Review bill"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-emerald-950/50 transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60",
                hasItems
                  ? "hover:bg-emerald-400 active:scale-95"
                  : "pointer-events-none opacity-50",
              )}
            >
              Review
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-emerald-500/15 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] font-medium text-emerald-300/80">Active</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[rgba(2,44,34,0.8)] px-2.5 py-0.5">
            <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <User className="size-2.5" strokeWidth={2.5} />
            </span>
            <span className="max-w-[7rem] truncate text-[11px] font-medium text-emerald-300">
              {displayName}
            </span>
          </div>
        </div>
      </section>
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
        className="fixed z-[80] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl"
        style={{ top: pos.top, right: pos.right }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
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

        <ul className="max-h-[min(60vh,24rem)] divide-y divide-border overflow-y-auto">
          {notifications.map((n) => {
            const isUnread = !readIds.has(n.id);
            return (
              <li
                key={n.id}
                className={cn(
                  "flex gap-3 px-4 py-3 transition",
                  isUnread ? "bg-primary/10" : "bg-popover",
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
