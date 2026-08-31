"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck, LayoutDashboard } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  useNotificationState,
  useNotificationStore,
} from "@/stores/notification-store";

/**
 * Compact top app bar: app name on the left, bell on the right. Mounted once
 * in the `(user)` layout so every authenticated screen (Home, Activity, Stats,
 * Profile) shares the same header.
 *
 * The bell shows an unread indicator and opens a dropdown of notifications. The
 * list lives in the notification store (`@/stores/notification-store`), which
 * is seeded with a few static entries and also receives real events (e.g.
 * spend-milestone toasts). Nothing is persisted — "Mark all read" clears the
 * badge for the current session.
 */

export function AppHeader({ isAdmin }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { notifications, readIds } = useNotificationState();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const unread = notifications.filter((n) => !readIds.has(n.id));
  const unreadCount = unread.length;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close when navigating to another route (e.g. tapping a bottom-nav item).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-border/60 bg-background">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-primary">{APP_NAME}</h1>
          {isAdmin && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary transition hover:bg-primary/20 active:scale-95"
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
            className="relative flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 active:scale-90"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background"
              />
            )}
          </button>

          {open && (
            <>
              {/* Transparent click-catcher to close on outside click. */}
              <button
                type="button"
                aria-label="Close notifications"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-foreground/5"
              >
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                  <h2 className="text-sm font-bold text-foreground">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:opacity-80"
                    >
                      <CheckCheck className="size-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <ul className="max-h-[60vh] divide-y divide-border/60 overflow-y-auto">
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
                            <p className="truncate text-sm font-semibold text-foreground">
                              {n.title}
                            </p>
                            {isUnread && (
                              <span className="size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground/80">
                            {n.time}
                          </p>
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
          )}
        </div>
      </div>
    </header>
  );
}
