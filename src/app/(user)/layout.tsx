import type { ReactNode } from "react";
import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";

/**
 * Layout for authenticated app screens. Renders the common top app bar above
 * the page content and the fixed bottom navigation beneath it. (Auth pages
 * live in the `(auth)` group and do not get this chrome.)
 */
export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
      <BottomNav />
    </>
  );
}
