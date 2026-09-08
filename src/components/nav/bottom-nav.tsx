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
        className="size-7 rounded-full border-2 border-white object-cover"
      />
    );
  }

  return (
    <User
      className="size-[1.15rem] text-white transition-[fill,stroke-width]"
      fill={active ? "currentColor" : "none"}
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    />
  );
}

/** Floating pill bottom navigation with filled active / outline inactive icons. */
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
          "mx-auto flex h-16 w-full max-w-md items-stretch justify-around",
          "rounded-[1.35rem] bg-primary shadow-[0_8px_28px_rgba(0,166,81,0.35)]",
        )}
      >
        {tabs.map((tab) => {
          const active = tab.matches.some(
            (p) => pathname === p || pathname.startsWith(`${p}/`),
          );
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.href === "/profile" && showProfileImage ? "Profile" : undefined}
                className="flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-white"
              >
                <span className="relative flex size-7 items-center justify-center">
                  {tab.href === "/profile" ? (
                    <ProfileTabIcon
                      avatarUrl={avatarUrl}
                      active={active}
                      failed={avatarFailed}
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <Icon
                      className="size-[1.15rem] text-white transition-[fill,stroke-width]"
                      fill={active ? "currentColor" : "none"}
                      strokeWidth={active ? 0 : 1.75}
                      aria-hidden
                    />
                  )}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex size-4 items-center justify-center rounded-full bg-primary-foreground text-[9px] font-bold text-primary">
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
