import { requireUser } from "@/lib/auth/server";
import {
  getActiveItems,
  getRecentItems,
  getTodayBill,
} from "@/lib/services/billing";
import { BillingScreen } from "@/components/billing/billing-screen";

export default async function HomePage() {
  const session = await requireUser();

  const [items, todayBill, recent] = await Promise.all([
    getActiveItems(),
    getTodayBill(session.user.id),
    getRecentItems(session.user.id),
  ]);

  return (
    <BillingScreen items={items} todayBill={todayBill} recent={recent} />
  );
}
