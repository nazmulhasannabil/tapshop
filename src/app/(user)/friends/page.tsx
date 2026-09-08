import { requireUser } from "@/lib/auth/server";
import { getFriendsListPage, type FriendsListKind } from "@/lib/services/friends";
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

  const list: FriendsListKind = requestRaw ? "requests" : "friends";
  const page = await getFriendsListPage(session.user.id, list, null);

  return (
    <FriendsPageClient
      userId={session.user.id}
      initialList={list}
      initialPage={page}
      inviteToken={inviteRaw ?? null}
      highlightFriendshipId={requestRaw ?? null}
    />
  );
}
