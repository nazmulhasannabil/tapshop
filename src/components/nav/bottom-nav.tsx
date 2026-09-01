"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, User, HandCoins, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFriends } from "@/hooks/queries/use-friends";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Pathnames that should mark this tab active. */
  matches: string[];
  badge?: number;
};

const BASE_TABS: Omit<Tab, "badge">[] = [
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
  { href: "/friends", label: "Friends", icon: Users, matches: ["/friends"] },
  { href: "/profile", label: "Profile", icon: User, matches: ["/profile"] },
];

/** Fixed bottom navigation with primary destinations. */
export function BottomNav({ userId }: { userId: string }) {
  const pathname = usePathname();
  const { data: friendsOverview } = useFriends(userId);
  const pendingCount = friendsOverview?.pendingIncoming.length ?? 0;

  const tabs: Tab[] = BASE_TABS.map((tab) =>
    tab.href === "/friends" ? { ...tab, badge: pendingCount } : tab,
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-[var(--bottom-nav-h)] w-full max-w-md items-stretch justify-around">
        {tabs.map((tab) => {
          const active = tab.matches.some((p) => pathname === p || pathname.startsWith(`${p}/`));
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary/10",
                  )}
                >
                  <Icon className="size-5" />
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
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
