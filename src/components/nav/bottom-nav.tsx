"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ChartPie,
  Banknote,
  MessageCircleMore,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFriendCounts } from "@/hooks/queries/use-friends";

type Tab = {
  href: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    fill?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  /** Pathnames that should mark this tab active. */
  matches: string[];
  badge?: number;
};

const BASE_TABS: Omit<Tab, "badge">[] = [
  { href: "/home", label: "Home", icon: Home, matches: ["/home"] },
  {
    href: "/activity",
    label: "Activity",
    icon: ChartPie,
    matches: ["/activity", "/stats"],
  },
  {
    href: "/debts",
    label: "Debts",
    icon: Banknote,
    matches: ["/debts"],
  },
  {
    href: "/friends",
    label: "Friends",
    icon: MessageCircleMore,
    matches: ["/friends"],
  },
  { href: "/profile", label: "Profile", icon: User, matches: ["/profile"] },
];

function ProfileTabIcon({
  avatarUrl,
  active,
  failed,
  onError,
}: {
  avatarUrl?: string | null;
  active: boolean;
  failed: boolean;
  onError: () => void;
}) {
  if (avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        onError={onError}
        className={cn(
          "size-7 rounded-full object-cover",
          active ? "ring-2 ring-primary" : "ring-1 ring-border",
        )}
      />
    );
  }

  return (
    <User
      className={cn(
        "size-5 transition-colors",
        active ? "text-primary" : "text-slate-400",
      )}
      fill={active ? "currentColor" : "none"}
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    />
  );
}

/** Dark floating island bottom nav with emerald active state (Figma). */
export function BottomNav({
  userId,
  avatarUrl,
}: {
  userId: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const { data: friendCounts } = useFriendCounts(userId);
  const pendingCount = friendCounts?.pendingIncoming ?? 0;
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showProfileImage = Boolean(avatarUrl) && !avatarFailed;

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  const tabs: Tab[] = BASE_TABS.map((tab) =>
    tab.href === "/friends" ? { ...tab, badge: pendingCount } : tab,
  );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-3"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <ul
        className={cn(
          "mx-auto flex h-[69px] w-full max-w-md items-stretch justify-around px-2",
          "rounded-[1.25rem] border border-border bg-[#121927]/95 shadow-[0_8px_28px_rgba(0,0,0,0.45),0_0_0_1px_rgba(16,185,129,0.08)] backdrop-blur-md",
        )}
      >
        {tabs.map((tab) => {
          const active = tab.matches.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`),
          );
          const Icon = tab.icon;
          const isHome = tab.href === "/home";
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.href === "/profile" && showProfileImage ? "Profile" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-slate-400",
                )}
              >
                <span className="relative flex size-8 items-center justify-center">
                  {tab.href === "/profile" ? (
                    <ProfileTabIcon
                      avatarUrl={avatarUrl}
                      active={active}
                      failed={avatarFailed}
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : isHome && active ? (
                    <span className="flex size-8 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-xs font-bold text-primary shadow-[0_0_12px_rgba(16,185,129,0.35)]">
                      T
                    </span>
                  ) : (
                    <Icon
                      className="size-5 transition-[fill,stroke-width,color]"
                      fill={active ? "currentColor" : "none"}
                      strokeWidth={active ? 0 : 1.75}
                      aria-hidden
                    />
                  )}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -right-1 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </span>
                {!(tab.href === "/profile" && showProfileImage) && (
                  <span className={cn(active && "font-semibold")}>{tab.label}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
