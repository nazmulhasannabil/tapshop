import { requireUser } from "@/lib/auth/server";
import { getStats } from "@/lib/services/stats";
import { StatsScreen } from "@/components/stats/stats-screen";

export default async function StatsPage() {
  const session = await requireUser();
  const stats = await getStats(session.user.id);

  return <StatsScreen stats={stats} />;
}
