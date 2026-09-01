import { requireUser } from "@/lib/auth/server";
import { getDebtSummary, groupDebts } from "@/lib/services/debts";
import { DebtsScreen } from "@/components/debts/debts-screen";
import { DEBT_STATUS } from "@/lib/social-constants";

export default async function DebtsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const friendRaw = Array.isArray(params.friend) ? params.friend[0] : params.friend;

  const [summary, groups] = await Promise.all([
    getDebtSummary(session.user.id),
    groupDebts(session.user.id, DEBT_STATUS.OPEN, friendRaw ?? undefined),
  ]);

  return (
    <DebtsScreen
      userId={session.user.id}
      initialSummary={summary}
      initialGroups={groups}
      friendFilterId={friendRaw ?? null}
    />
  );
}
