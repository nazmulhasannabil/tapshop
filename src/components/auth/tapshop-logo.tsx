import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Outline wallet mark in primary emerald — no tile / rounded background. */
export function BrandMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static public brand asset */}
      <img
        src="/wallet-logo.png"
        alt=""
        aria-hidden
        draggable={false}
        className={cn("size-full object-contain", iconClassName)}
        style={{
          // Black outline → emerald primary (#10b981)
          filter:
            "brightness(0) saturate(100%) invert(64%) sepia(52%) saturate(528%) hue-rotate(107deg) brightness(95%) contrast(92%)",
        }}
      />
    </span>
  );
}

/** TapShop mark — outline wallet + wordmark. */
export function TapShopLogo() {
  return (
    <Link href="/" className="flex flex-col items-center gap-2 select-none">
      <BrandMark className="size-12" />
      <span className="text-xl font-bold tracking-tight text-white">{APP_NAME}</span>
    </Link>
  );
}
