"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/auth/client";
import { APP_MOTTO, APP_NAME, ONBOARDING_COOKIE } from "@/lib/constants";

const MIN_DISPLAY_MS = 1500;

export function OnboardingScreen() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const startTime = useRef(Date.now());
  const redirected = useRef(false);

  useEffect(() => {
    if (isPending || redirected.current) return;

    const elapsed = Date.now() - startTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      redirected.current = true;
      document.cookie = `${ONBOARDING_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
      router.replace(session ? "/home" : "/login");
    }, remaining);

    return () => clearTimeout(timer);
  }, [isPending, session, router]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-10">
      <div className="flex flex-col items-center gap-3 select-none">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-sm">
          🧾
        </span>
        <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>
        <p className="text-sm text-muted-foreground">{APP_MOTTO}</p>
      </div>
    </div>
  );
}
