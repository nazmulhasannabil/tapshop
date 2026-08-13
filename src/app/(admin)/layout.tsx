import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";

/**
 * Layout for the admin dashboard screens. Renders the admin-specific header
 * and a 3-tab bottom navigation (Dashboard / Users / Settings).
 *
 * Protected: non-admin users are redirected to /home.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <>
      <AdminHeader />
      {children}
      <AdminBottomNav />
    </>
  );
}
