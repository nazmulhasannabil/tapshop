import { getTodayBreakdown } from "@/lib/services/admin";
import { TodayBreakdownScreen } from "@/components/admin/today-breakdown-screen";

export const metadata = { title: "Today's Spend — TapShop Admin" };

export default async function TodaySpendPage() {
  const { total, users } = await getTodayBreakdown();
  return <TodayBreakdownScreen total={total} users={users} />;
}
