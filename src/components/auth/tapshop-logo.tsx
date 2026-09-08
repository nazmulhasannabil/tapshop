import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

/** Existing TapShop mark — receipt tile + wordmark, unchanged. */
export function TapShopLogo() {
  return (
    <Link href="/" className="flex flex-col items-center gap-2 select-none">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-sm">
        🧾
      </span>
      <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>
    </Link>
  );
}
