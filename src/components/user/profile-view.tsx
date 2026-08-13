"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  Loader2,
  LogOut,
  type LucideIcon,
  MessageCircle,
  Moon,
  Palette,
  Pencil,
  Sun,
  User,
} from "lucide-react";

import { authClient } from "@/lib/auth/client";
import type { MostUsed } from "@/lib/services/stats";
import { cn } from "@/lib/utils";

type SettingsRow = {
  icon: LucideIcon;
  label: string;
  value?: string;
  /** Placeholder feature — shows a muted "Coming soon" pill and fires a toast. */
  comingSoon?: boolean;
};

const accountRows: SettingsRow[] = [
  { icon: CreditCard, label: "Payment Methods", comingSoon: true },
  { icon: User, label: "Personal Information", comingSoon: true },
  { icon: Bell, label: "Notification Settings", comingSoon: true },
];

const appRows: SettingsRow[] = [
  { icon: Globe, label: "Language", value: "English", comingSoon: true },
];

// Support contact info. The wa.me link uses the international number without
// the leading "+" (880 = Bangladesh) — the standard WhatsApp deep-link format.
const SUPPORT_WHATSAPP_DISPLAY = "+8801881649665";
const SUPPORT_WHATSAPP_LINK = "https://wa.me/8801881649665";

export function ProfileView({
  name,
  email,
  avatarUrl,
  totalConsumptionLabel,
  favoriteItem,
  memberSinceLabel,
}: {
  name: string;
  email: string;
  /** Resolved avatar: user image if set, else a Gravatar URL from the email. */
  avatarUrl: string;
  totalConsumptionLabel: string;
  favoriteItem: MostUsed | null;
  memberSinceLabel: string;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // True when the resolved avatar URL fails to load (e.g. no Gravatar) — fall
  // back to the user's initial.
  const [imgError, setImgError] = useState(false);
  // True while a new avatar is being uploaded.
  const [uploading, setUploading] = useState(false);
  // Optimistically holds the just-uploaded data URL until `router.refresh()`
  // reconciles the server-rendered `avatarUrl` prop.
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = name.charAt(0).toUpperCase() || "?";
  const displayAvatar = localAvatar ?? avatarUrl;
  // next-themes resolves the theme in a post-mount effect, so `resolvedTheme`
  // is undefined during both SSR and the hydration render (both fall back to
  // "light") — no hydration mismatch.
  const themeLabel = resolvedTheme ?? "light";

  async function handleLogout() {
    setPending(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  function notifyComingSoon(label: string) {
    toast(`${label} — coming soon`);
  }

  /**
   * Resize the picked image to a 256×256 center-cropped square JPEG blob, so the
   * stored data URL stays small (~20–40 KB) without any server-side dependency.
   */
  async function resizeAvatar(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const size = 256;
    const min = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - min) / 2;
    const sy = (bitmap.height - min) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process the image.");
    ctx.drawImage(bitmap, sx, sy, min, min, 0, 0, size, size);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) throw new Error("Could not encode the image.");
    return blob;
  }

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires `change`.
    e.target.value = "";
    if (!file) return;

    try {
      setUploading(true);
      const blob = await resizeAvatar(file);
      const body = new FormData();
      body.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/profile/image", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Upload failed.");
      }
      setLocalAvatar(json.data.image as string);
      setImgError(false);
      toast.success("Profile picture updated.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Close the logout confirmation on Escape (ignored while a request is running).
  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, pending]);

  // Close the appearance sheet on Escape.
  useEffect(() => {
    if (!appearanceOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAppearanceOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [appearanceOpen]);

  // Close the help & support sheet on Escape.
  useEffect(() => {
    if (!helpOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <main className="flex-1 space-y-6 px-4 pt-6 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
        {/* Profile */}
        <section className="flex flex-col items-center gap-1 pt-2 text-center">
          <div className="relative size-24">
            <div className="relative flex size-24 items-center justify-center rounded-full bg-accent">
              {displayAvatar && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt={name}
                  onError={() => setImgError(true)}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-primary">
                  {initial}
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Change profile picture"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-foreground/10 transition hover:bg-muted active:scale-90 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Pencil className="size-4 text-primary" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <h2 className="mt-2 text-xl font-bold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
        </section>

        {/* Total consumption */}
        <section className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Total Consumption
          </p>
          <p className="mt-1 text-3xl font-bold text-primary tnum">
            {totalConsumptionLabel}
          </p>
        </section>

        {/* Summary grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Favorite Item
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl leading-none">
                {favoriteItem?.icon ?? "☕"}
              </span>
              <span className="font-semibold text-foreground">
                {favoriteItem?.name ?? "—"}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Member Since
            </p>
            <p className="mt-3 font-semibold text-foreground">
              {memberSinceLabel}
            </p>
          </div>
        </section>

        {/* Account settings */}
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Account Settings
          </h3>
          <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
            <div className="divide-y divide-border">
              {accountRows.map((row) => (
                <SettingsRowButton
                  key={row.label}
                  row={row}
                  onClick={() => notifyComingSoon(row.label)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* App settings */}
        <section className="space-y-3">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            App Settings
          </h3>
          <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5">
            <div className="divide-y divide-border">
              <SettingsRowButton
                row={{
                  icon: Palette,
                  label: "Appearance",
                  value: themeLabel.charAt(0).toUpperCase() + themeLabel.slice(1),
                }}
                onClick={() => setAppearanceOpen(true)}
              />
              {appRows.map((row) => (
                <SettingsRowButton
                  key={row.label}
                  row={row}
                  onClick={() => notifyComingSoon(row.label)}
                />
              ))}
              <SettingsRowButton
                row={{ icon: HelpCircle, label: "Help & Support" }}
                onClick={() => setHelpOpen(true)}
              />
            </div>
          </div>
        </section>

        {/* Logout */}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3.5 font-semibold text-destructive transition hover:bg-destructive/20 active:scale-[0.99]"
        >
          <LogOut className="size-5" />
          Logout
        </button>
      </main>

      {/* Logout confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Cancel logout"
              tabIndex={-1}
              onClick={() => !pending && setConfirmOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative w-full max-w-sm rounded-3xl bg-card p-5 shadow-xl ring-1 ring-foreground/5"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <LogOut className="size-5" />
              </div>
              <h3
                id="logout-title"
                className="mt-3 text-lg font-bold text-foreground"
              >
                Log out?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You can sign back in any time. Your data stays saved.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                  className="h-11 flex-1 rounded-xl bg-muted px-4 font-semibold text-foreground transition hover:bg-muted/70 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={pending}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive px-4 font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  {pending ? "Signing out…" : "Logout"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appearance switcher */}
      <AnimatePresence>
        {appearanceOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close appearance"
              tabIndex={-1}
              onClick={() => setAppearanceOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="appearance-title"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative w-full max-w-sm rounded-3xl bg-card p-5 shadow-xl ring-1 ring-foreground/5"
            >
              <h3
                id="appearance-title"
                className="text-lg font-bold text-foreground"
              >
                Appearance
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose how TapShop looks to you.
              </p>
              <div className="mt-4 space-y-2">
                {(
                  [
                    { mode: "light", label: "Light", Icon: Sun },
                    { mode: "dark", label: "Dark", Icon: Moon },
                  ] as const
                ).map(({ mode, label, Icon }) => {
                  const active = resolvedTheme === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setTheme(mode);
                        setAppearanceOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
                        active
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "hover:bg-muted",
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="flex-1 font-medium">{label}</span>
                      {active && <Check className="size-5" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help & support */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close help & support"
              tabIndex={-1}
              onClick={() => setHelpOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-title"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative w-full max-w-sm rounded-3xl bg-card p-5 shadow-xl ring-1 ring-foreground/5"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HelpCircle className="size-5" />
              </div>
              <h3
                id="help-title"
                className="mt-3 text-lg font-bold text-foreground"
              >
                Help &amp; Support
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Have a question about your orders, account, or payments? Our
                team is here to help you get the most out of TapShop.
              </p>

              {/* WhatsApp number */}
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    WhatsApp
                  </p>
                  <p className="font-semibold text-foreground">
                    {SUPPORT_WHATSAPP_DISPLAY}
                  </p>
                </div>
              </div>

              {/* Call on WhatsApp */}
              <a
                href={SUPPORT_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 font-semibold text-white transition hover:bg-[#1ebe5d] active:scale-[0.99]"
              >
                <MessageCircle className="size-4" />
                Call on WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsRowButton({
  row,
  onClick,
}: {
  row: SettingsRow;
  onClick: () => void;
}) {
  const Icon = row.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/50 active:bg-muted"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="flex-1 font-medium text-foreground">{row.label}</span>
      {row.comingSoon ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Coming soon
        </span>
      ) : (
        <>
          {row.value && (
            <span className="text-sm text-muted-foreground">{row.value}</span>
          )}
          <ChevronRight className="size-4 text-muted-foreground" />
        </>
      )}
    </button>
  );
}
