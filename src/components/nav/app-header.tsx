"use client";

import { Bell } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

/**
 * Compact top app bar: app name on the left, bell on the right. Mounted once
 * in the `(user)` layout so every authenticated screen (Home, Activity, Stats,
 * Profile) shares the same header.
 */
export function AppHeader() {
  return (
    <header className="border-b border-border/60 bg-background">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <h1 className="text-lg font-bold text-primary">{APP_NAME}</h1>

        <button
          type="button"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/10 active:scale-90"
        >
          <Bell className="size-5" />
        </button>
      </div>
    </header>
  );
}
