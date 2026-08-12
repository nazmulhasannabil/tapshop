import { requireUser } from "@/lib/auth/server";
import { getActivityFeed } from "@/lib/services/billing";
import { ActivityScreen } from "@/components/activity/activity-screen";

export default async function ActivityPage() {
  const session = await requireUser();
  const entries = await getActivityFeed(session.user.id);

  return <ActivityScreen entries={entries} />;
}
