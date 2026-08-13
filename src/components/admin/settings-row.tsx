import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsRowProps = {
  icon: ReactNode;
  label: string;
  /** When false, the bottom divider is omitted (useful for the last row). */
  showDivider?: boolean;
  /** When true, shows a "Coming soon" pill instead of the chevron. */
  comingSoon?: boolean;
  className?: string;
};

/** A single settings navigation row with icon, label, and chevron (or coming-soon pill). */
export function SettingsRow({
  icon,
  label,
  showDivider = true,
  comingSoon,
  className,
}: SettingsRowProps) {
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3.5 py-3.5 transition-colors hover:bg-accent/50 rounded-xl -mx-2 px-2",
          className,
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
          {icon}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">
          {label}
        </span>
        {comingSoon ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Coming soon
          </span>
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </div>
      {showDivider && <div className="h-px bg-border/60" />}
    </>
  );
}
