"use client";

import { Bell } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

/** TapShop admin header — logo + brand + notification bell. */
export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        {/* Logo + brand */}
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            T
          </span>
          <h1 className="text-lg font-bold text-primary">{APP_NAME}</h1>
        </div>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
        >
          <Bell className="size-5 text-foreground" />
        </button>
      </div>
    </header>
  );
}
