import { requireUser } from "@/lib/auth/server";
import { ProfileView } from "@/components/user/profile-view";

export default async function ProfilePage() {
  const session = await requireUser();
  return (
    <ProfileView
      name={session.user.name}
      email={session.user.email}
      role={session.user.role ?? "user"}
    />
  );
}
