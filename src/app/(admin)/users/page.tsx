import { getAdminUsers } from "@/lib/services/admin";
import { UsersScreen } from "@/components/admin/users-screen";

export const metadata = { title: "Users — TapShop Admin" };

export default async function UsersPage() {
  const users = await getAdminUsers();
  return <UsersScreen users={users} />;
}
