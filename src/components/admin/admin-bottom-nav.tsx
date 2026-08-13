"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Pathnames that should mark this tab active. */
  matches: string[];
};

const TABS: Tab[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, matches: ["/dashboard"] },
  { href: "/users", label: "Users", icon: Users, matches: ["/users"] },
  { href: "/settings", label: "Settings", icon: Settings, matches: ["/settings"] },
];

/**
 * Fixed 3-tab bottom navigation for the admin dashboard.
 * Automatically hides on nested detail routes (e.g. /users/[id]).
 */
export function AdminBottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on nested detail pages (e.g. /users/123, /dashboard/today)
  const isDetailPage =
    (pathname.startsWith("/users/") || pathname.startsWith("/dashboard/")) &&
    pathname.split("/").length >= 3;
  if (isDetailPage) return null;

  return (
    <nav
      aria-label="Admin navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-[var(--bottom-nav-h)] w-full max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.matches.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`),
          );
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
