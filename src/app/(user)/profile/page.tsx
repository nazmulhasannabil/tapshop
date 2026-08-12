import { requireUser } from "@/lib/auth/server";
import { ProfileView } from "@/components/user/profile-view";
import { getProfileData } from "@/lib/services/profile";
import { gravatarUrl } from "@/lib/gravatar";
import { formatCurrency } from "@/lib/constants";

export default async function ProfilePage() {
  const session = await requireUser();
  const { totalConsumption, favoriteItem, memberSinceLabel } =
    await getProfileData(session.user.id);

  return (
    <ProfileView
      name={session.user.name}
      email={session.user.email}
      avatarUrl={session.user.image ?? gravatarUrl(session.user.email)}
      totalConsumptionLabel={formatCurrency(totalConsumption)}
      favoriteItem={favoriteItem}
      memberSinceLabel={memberSinceLabel}
    />
  );
}
