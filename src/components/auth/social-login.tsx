"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  type AuthProvider,
  type UserCredential,
} from "firebase/auth";
import { toast } from "sonner";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";

const PROVIDERS = [
  { id: "facebook", label: "Continue with Facebook", icon: FacebookIcon, hidden: true },
  { id: "google", label: "Continue with Google", icon: GoogleIcon, hidden: false },
  { id: "apple", label: "Continue with Apple", icon: AppleIcon, hidden: true },
] as const;

type SocialProviderId = (typeof PROVIDERS)[number]["id"];

function providerFor(id: SocialProviderId): AuthProvider {
  if (id === "google") return new GoogleAuthProvider();
  if (id === "facebook") return new FacebookAuthProvider();
  return new OAuthProvider("apple.com");
}

function isIgnorablePopupError(code: string) {
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}

function popupErrorMessage(code: string) {
  if (code === "auth/popup-blocked") return "The sign-in popup was blocked. Allow popups and try again.";
  if (code === "auth/unauthorized-domain") return "This site isn't authorized for Google sign-in yet.";
  if (code === "auth/operation-not-allowed") return "Google sign-in isn't enabled for this app yet.";
  return "Couldn't sign you in. Try again.";
}

/**
 * Social buttons match the reference. Facebook and Apple stay hidden until
 * those Firebase providers are configured. Google signs in with Firebase,
 * then exchanges the ID token for a Better Auth session.
 */
export function SocialLoginButtons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<SocialProviderId | null>(null);
  const visible = PROVIDERS.filter((provider) => !provider.hidden);

  async function finishSession(credential: UserCredential) {
    const idToken = await credential.user.getIdToken();
    const res = await fetch("/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "Couldn't sign you in.");
      return;
    }

    const inviteToken = searchParams.get("invite");
    if (inviteToken) {
      router.push(`/friends?invite=${encodeURIComponent(inviteToken)}`);
    } else {
      router.push(searchParams.get("redirect") || "/home");
    }
    router.refresh();
  }

  async function onProviderClick(id: SocialProviderId) {
    if (pending) return;
    if (!isFirebaseConfigured()) {
      toast.error("Google sign-in isn't configured yet.");
      return;
    }

    setPending(id);
    try {
      const credential = await signInWithPopup(getFirebaseAuth(), providerFor(id));
      await finishSession(credential);
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (!isIgnorablePopupError(code)) {
        toast.error(popupErrorMessage(code));
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {visible.map((provider) => (
        <button
          key={provider.id}
          type="button"
          aria-label={provider.label}
          aria-busy={pending === provider.id}
          disabled={pending !== null}
          onClick={() => void onProviderClick(provider.id)}
          className="flex size-11 items-center justify-center rounded-full bg-card shadow-[0_2px_8px_-2px_oklch(0.2_0.02_155/0.18)] ring-1 ring-border/80 transition hover:bg-accent active:scale-95 disabled:pointer-events-none disabled:opacity-60"
        >
          <provider.icon />
        </button>
      ))}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#1877F2"
        d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07C2 17.1 5.66 21.24 10.44 22v-7.03H7.9v-2.9h2.54V9.84c0-2.52 1.49-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.48h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22C18.34 21.24 22 17.1 22 12.07Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.74-.06-1.28-.2-1.84H12v3.34h5.5c-.11.9-.72 2.26-2.06 3.17l-.02.12 2.9 2.2.2.02c1.84-1.66 2.9-4.1 2.9-6.01Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.87 6.62-2.37l-3.08-2.34c-.82.56-1.92.96-3.54.96-2.7 0-4.99-1.76-5.81-4.2l-.11.01-3.02 2.3-.04.1C5.84 19.98 8.68 22 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.19 14.05A6.1 6.1 0 0 1 5.86 12c0-.71.12-1.4.32-2.05l-.01-.13-3.06-2.32-.1.05A9.96 9.96 0 0 0 2 12c0 1.61.39 3.13 1.08 4.47l3.11-2.42Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.75c1.92 0 3.22.83 3.96 1.52l2.89-2.82C16.95 2.8 14.7 2 12 2 8.68 2 5.84 4.02 3.9 7.55l3.1 2.4C7.01 7.5 9.3 5.75 12 5.75Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 text-foreground" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 12.64c.03 2.9 2.55 3.86 2.58 3.88-.02.07-.4 1.38-1.33 2.74-.8 1.16-1.63 2.32-2.94 2.34-1.29.02-1.7-.76-3.17-.76s-1.93.74-3.15.78c-1.27.05-2.24-1.26-3.05-2.41-1.66-2.38-2.93-6.72-1.22-9.65.84-1.45 2.35-2.37 3.99-2.4 1.24-.02 2.42.84 3.17.84.75 0 2.16-1.04 3.64-.88.62.03 2.36.25 3.48 1.88-.09.06-2.08 1.21-2 3.48ZM14.7 4.9c.66-.8 1.11-1.92.99-3.03-.96.04-2.12.64-2.8 1.44-.62.71-1.16 1.85-1.01 2.94 1.07.08 2.16-.54 2.82-1.35Z"
      />
    </svg>
  );
}
