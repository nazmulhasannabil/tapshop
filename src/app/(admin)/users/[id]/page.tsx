import { notFound } from "next/navigation";
import { getAdminUserDetails } from "@/lib/services/admin";
import { UserDetailsScreen } from "@/components/admin/user-details-screen";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = await getAdminUserDetails(id);
  return {
    title: data ? `${data.user.name} — TapShop Admin` : "User — TapShop Admin",
  };
}

export default async function UserDetailsPage({ params }: Props) {
  const { id } = await params;
  const data = await getAdminUserDetails(id);
  if (!data) notFound();

  return (
    <UserDetailsScreen user={data.user} transactions={data.transactions} />
  );
}
