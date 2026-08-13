import { getActiveTodayUsers } from "@/lib/services/admin";
import { ActiveTodayScreen } from "@/components/admin/active-today-screen";

export const metadata = { title: "Active Today — TapShop Admin" };

export default async function ActiveTodayPage() {
  const users = await getActiveTodayUsers();
  return <ActiveTodayScreen users={users} />;
}
