import { requireUser } from "@/lib/auth/server";
import {
  getActiveItems,
  getRecentItems,
  getTodayBill,
} from "@/lib/services/billing";
import { getCategories } from "@/lib/services/categories";
import { BillingScreen } from "@/components/billing/billing-screen";

export default async function HomePage() {
  const session = await requireUser();

  const [items, todayBill, recent, categories] = await Promise.all([
    getActiveItems(session.user.id),
    getTodayBill(session.user.id),
    getRecentItems(session.user.id),
    getCategories(session.user.id),
  ]);

  return (
    <BillingScreen
      items={items}
      todayBill={todayBill}
      recent={recent}
      categories={categories}
      isAdmin={session.user.role === "admin"}
      userName={session.user.name}
    />
  );
}
