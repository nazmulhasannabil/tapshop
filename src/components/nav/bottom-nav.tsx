"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, User, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Pathnames that should mark this tab active. */
  matches: string[];
};

const TABS: Tab[] = [
  { href: "/home", label: "Home", icon: Home, matches: ["/home"] },
  {
    href: "/activity",
    label: "Activity",
    icon: ReceiptText,
    matches: ["/activity", "/stats"],
  },
  {
    href: "/debts",
    label: "Debts",
    icon: HandCoins,
    matches: ["/debts"],
  },
  { href: "/profile", label: "Profile", icon: User, matches: ["/profile"] },
];

/** Fixed bottom navigation with primary destinations. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-[var(--bottom-nav-h)] w-full max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = tab.matches.some((p) => pathname === p || pathname.startsWith(`${p}/`));
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
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
