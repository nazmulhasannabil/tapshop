import { requireUser } from "@/lib/auth/server";
import {
  getActiveItems,
  getFrequentItems,
  getRecentItems,
  getTodayBill,
} from "@/lib/services/billing";
import { BillingScreen } from "@/components/billing/billing-screen";

export default async function HomePage() {
  const session = await requireUser();

  const [items, todayBill, recent, frequent] = await Promise.all([
    getActiveItems(),
    getTodayBill(session.user.id),
    getRecentItems(session.user.id),
    getFrequentItems(session.user.id),
  ]);

  return (
    <BillingScreen
      userName={session.user.name}
      items={items}
      todayBill={todayBill}
      recent={recent}
      frequent={frequent}
    />
  );
}
