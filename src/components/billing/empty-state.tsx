import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon = "👀",
  title,
  description,
  className,
  children,
}: {
  icon?: string;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      <span className="text-3xl">{icon}</span>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-xs text-xs text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
