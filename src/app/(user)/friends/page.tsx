import { requireUser } from "@/lib/auth/server";
import { getFriendsOverview } from "@/lib/services/friends";
import { FriendsPageClient } from "@/components/friends/friends-page-client";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const inviteRaw = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  const requestRaw = Array.isArray(params.request) ? params.request[0] : params.request;

  const overview = await getFriendsOverview(session.user.id);

  return (
    <FriendsPageClient
      userId={session.user.id}
      initial={overview}
      inviteToken={inviteRaw ?? null}
      highlightFriendshipId={requestRaw ?? null}
    />
  );
}
