import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/server";
import { AppHeader } from "@/components/nav/app-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { QueryProvider } from "@/components/providers/query-provider";

/**
 * Layout for authenticated app screens. Renders the common top app bar above
 * the page content and the fixed bottom navigation beneath it. (Auth pages
 * live in the `(auth)` group and do not get this chrome.)
 *
 * Also checks the user's role so the header can conditionally show an "Admin"
 * badge linking to the admin dashboard.
 */
export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  const isAdmin = session.user.role === "admin";

  return (
    <QueryProvider>
      <AppHeader isAdmin={isAdmin} />
      {children}
      <BottomNav userId={session.user.id} />
    </QueryProvider>
  );
}
