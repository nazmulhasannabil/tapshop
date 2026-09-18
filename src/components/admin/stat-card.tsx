import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  badge?: ReactNode;
  /** When true, the entire card is styled with the primary indigo colour. */
  variant?: "default" | "primary";
  /** Optional route — when provided the card renders as a clickable link. */
  href?: string;
  className?: string;
  /** Renders as a list row without its own card chrome. */
  embedded?: boolean;
};

/** Compact stat card: icon on the left, label/value on the right. */
export function StatCard({
  icon,
  label,
  value,
  badge,
  variant = "default",
  href,
  className,
  embedded = false,
}: StatCardProps) {
  const isPrimary = variant === "primary" && !embedded;

  const content = (
    <>
      {badge && (
        <div className="absolute right-0 top-0 z-10 -translate-y-1/3 translate-x-1/4">
          {badge}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            isPrimary
              ? "bg-primary-foreground/15"
              : embedded && variant === "primary"
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-foreground",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              isPrimary
                ? "text-primary-foreground/80"
                : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-0.5 text-2xl font-bold tracking-tight tnum",
              !isPrimary && "text-foreground",
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </>
  );

  const classes = cn(
    "relative",
    embedded
      ? "block px-4 py-3 transition-colors hover:bg-accent/50 active:bg-accent"
      : cn(
          "rounded-2xl p-4 shadow-sm transition-shadow active:shadow-md",
          isPrimary
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "bg-card ring-1 ring-border",
          href && "cursor-pointer transition-transform hover:scale-[1.02]",
        ),
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(classes, !embedded && "block")}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
