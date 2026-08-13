import { getSession } from "@/lib/auth/server";
import { SettingsScreen } from "@/components/admin/settings-screen";

export const metadata = { title: "Settings — TapShop Admin" };

export default async function SettingsPage() {
  const session = await getSession();
  const user = session?.user;

  return (
    <SettingsScreen
      adminUser={{
        name: user?.name ?? "Admin",
        email: user?.email ?? "",
        image: user?.image ?? undefined,
      }}
    />
  );
}
