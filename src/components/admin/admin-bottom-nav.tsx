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
      className="fixed inset-x-0 bottom-0 z-40 px-3"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <ul
        className={cn(
          "mx-auto flex h-[69px] w-full max-w-md items-stretch justify-around",
          "rounded-[1.25rem] border border-border bg-[#121927]/95 shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md",
        )}
      >
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
                    : "text-slate-400 hover:text-foreground",
                )}
              >
                <span className="relative flex size-7 items-center justify-center">
                  <Icon
                    className={cn("size-5 transition-colors", active && "stroke-[2.25]")}
                    aria-hidden
                  />
                </span>
                <span className={cn(active && "font-semibold")}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
