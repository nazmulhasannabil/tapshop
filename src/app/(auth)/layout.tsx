import type { ReactNode } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-2 select-none"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-sm">
          🧾
        </span>
        <span className="text-xl font-semibold tracking-tight">{APP_NAME}</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
