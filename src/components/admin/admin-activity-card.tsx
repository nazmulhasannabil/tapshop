import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type ActivityType = "purchase" | "admin" | "user_join";

type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  amount?: string;
};

const TYPE_CONFIG: Record<
  ActivityType,
  { bg: string; icon: string }
> = {
  purchase: { bg: "bg-info/10", icon: "🛒" },
  admin: { bg: "bg-warning/15", icon: "⚙️" },
  user_join: { bg: "bg-success/10", icon: "👤" },
};

type ActivityCardProps = ActivityItem & {
  className?: string;
};

/** A single recent-activity row with a colored icon, description, and amount. */
export function ActivityCard({
  type,
  title,
  subtitle,
  amount,
  className,
}: ActivityCardProps) {
  const config = TYPE_CONFIG[type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-base",
          config.bg,
        )}
      >
        {config.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {amount && (
        <span className="shrink-0 text-sm font-semibold tnum text-foreground">
          {amount}
        </span>
      )}
    </div>
  );
}
