import {
  getSpendingsPageData,
  parseDashboardPeriod,
} from "@/lib/services/admin";
import { SpendingsScreen } from "@/components/admin/spendings-screen";

export const metadata = { title: "Spendings — TapShop Admin" };

export default async function SpendingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const periodInput = parseDashboardPeriod({
    period: params.period,
    date: params.date,
  });
  const { period, summary, spenders } =
    await getSpendingsPageData(periodInput);

  return (
    <SpendingsScreen
      period={period}
      summary={summary}
      spenders={spenders}
    />
  );
}
