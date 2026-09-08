import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/server";
import { BottomNav } from "@/components/nav/bottom-nav";
import { QueryProvider } from "@/components/providers/query-provider";

/**
 * Layout for authenticated app screens. Renders page content and the fixed
 * bottom navigation. The green home hero (brand + Today's Bill) lives only on
 * `/home`; other tabs use their own in-page titles without a global header.
 */
export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();

  return (
    <QueryProvider>
      {children}
      <BottomNav userId={session.user.id} avatarUrl={session.user.image} />
    </QueryProvider>
  );
}
