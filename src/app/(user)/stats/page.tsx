import { requireUser } from "@/lib/auth/server";
import { getStats } from "@/lib/services/stats";
import { StatsProvider } from "@/components/stats/stats-provider";

export default async function StatsPage() {
  const session = await requireUser();
  const stats = await getStats(session.user.id);

  return <StatsProvider initialStats={stats} />;
}
