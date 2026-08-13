import { getAdminDashboard } from "@/lib/services/admin";
import { DashboardScreen } from "@/components/admin/dashboard-screen";

export const metadata = { title: "Dashboard — TapShop Admin" };

export default async function DashboardPage() {
  const { stats, weekly, activity } = await getAdminDashboard();
  return (
    <DashboardScreen stats={stats} weekly={weekly} activity={activity} />
  );
}
