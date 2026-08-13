import { getMonthBreakdown } from "@/lib/services/admin";
import { MonthBreakdownScreen } from "@/components/admin/month-breakdown-screen";

export const metadata = { title: "Month Revenue — TapShop Admin" };

export default async function MonthRevenuePage() {
  const { total, users } = await getMonthBreakdown();
  return <MonthBreakdownScreen total={total} users={users} />;
}
