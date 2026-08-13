"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  LogOut,
  Loader2,
  Package,
  Shield,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsRow } from "./settings-row";

type AdminUser = {
  name: string;
  email: string;
  image?: string;
};

type SettingsScreenProps = {
  adminUser: AdminUser;
};

/** Settings rows that are not yet functional. */
const COMING_SOON_OPTIONS = [
  { icon: <LayoutGrid className="size-4" />, label: "Menu Management" },
  { icon: <Package className="size-4" />, label: "Inventory Controls" },
  { icon: <Shield className="size-4" />, label: "Security" },
  { icon: <Bell className="size-4" />, label: "Notifications" },
];

/** Show a toast for coming-soon features. */
function notifyComingSoon(label: string) {
  toast(`${label} — coming soon`);
}

/** Admin settings screen — profile, shop management, account, and sign out. */
export function SettingsScreen({ adminUser }: SettingsScreenProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = adminUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
      {/* Intro */}
      <div className="space-y-1 pb-4 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Manage your shop and account preferences.
        </p>
      </div>

      <main className="space-y-5">
        {/* Profile summary */}
        <section className="flex items-center gap-3.5 rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm">
          <Avatar className="size-12">
            {adminUser.image && (
              <AvatarImage src={adminUser.image} alt={adminUser.name} />
            )}
            <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-foreground">
              {adminUser.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {adminUser.email}
            </p>
          </div>
        </section>

        {/* Shop Management */}
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Shop Management
          </h2>
          <div className="rounded-2xl bg-card px-2 pb-1 pt-2 ring-1 ring-border shadow-sm">
            {COMING_SOON_OPTIONS.slice(0, 2).map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => notifyComingSoon(opt.label)}
                className="w-full text-left"
              >
                <SettingsRow
                  icon={opt.icon}
                  label={opt.label}
                  showDivider={i === 0}
                  comingSoon
                />
              </button>
            ))}
          </div>
        </section>

        {/* Account */}
        <section>
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </h2>
          <div className="rounded-2xl bg-card px-2 pb-1 pt-2 ring-1 ring-border shadow-sm">
            {COMING_SOON_OPTIONS.slice(2).map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => notifyComingSoon(opt.label)}
                className="w-full text-left"
              >
                <SettingsRow
                  icon={opt.icon}
                  label={opt.label}
                  showDivider={i === 0}
                  comingSoon
                />
              </button>
            ))}
          </div>
        </section>

        {/* Sign Out */}
        <button
          type="button"
          disabled={pending}
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 active:bg-destructive/20 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          {pending ? "Signing out..." : "Sign Out"}
        </button>
      </main>
    </div>
  );
}
