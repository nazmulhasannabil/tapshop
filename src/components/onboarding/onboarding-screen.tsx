"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import { useSession } from "@/lib/auth/client";
import { BrandMark } from "@/components/auth/tapshop-logo";
import { APP_MOTTO, APP_NAME } from "@/lib/constants";

const MIN_DISPLAY_MS = 3000;

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
      router.replace(session ? "/home" : "/login");
    }, remaining);

    return () => clearTimeout(timer);
  }, [isPending, session, router]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-10">
      <motion.div
        className="flex flex-col items-center gap-3 select-none"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrandMark className="size-14" />
        </motion.div>
        <span className="text-2xl font-bold tracking-tight text-white">{APP_NAME}</span>
        <p className="text-sm text-muted-foreground">{APP_MOTTO}</p>
      </motion.div>
    </div>
  );
}
