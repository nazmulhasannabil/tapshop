import {
  getAdminDashboard,
  parseDashboardPeriod,
} from "@/lib/services/admin";
import { DashboardScreen } from "@/components/admin/dashboard-screen";

export const metadata = { title: "Dashboard — Money Back Admin" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const periodInput = parseDashboardPeriod({
    period: params.period,
    date: params.date,
  });
  const { period, summary, daily, spenders, hasMoreSpenders } =
    await getAdminDashboard(periodInput);

  return (
    <DashboardScreen
      period={period}
      summary={summary}
      daily={daily}
      spenders={spenders}
      hasMoreSpenders={hasMoreSpenders}
    />
  );
}
