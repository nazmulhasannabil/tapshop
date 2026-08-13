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
};

/** Compact stat card with icon, optional badge, label, and large value. */
export function StatCard({
  icon,
  label,
  value,
  badge,
  variant = "default",
  href,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full",
            variant === "primary"
              ? "bg-white/15"
              : "bg-accent text-foreground",
          )}
        >
          {icon}
        </span>
        {badge && <div>{badge}</div>}
      </div>
      <p
        className={cn(
          "mt-3 text-[11px] font-semibold uppercase tracking-wide",
          variant === "primary"
            ? "text-primary-foreground/80"
            : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight tnum">
        {value}
      </p>
    </>
  );

  const classes = cn(
    "rounded-2xl p-4 shadow-sm transition-shadow active:shadow-md",
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
      : "bg-card ring-1 ring-border",
    href && "cursor-pointer transition-transform hover:scale-[1.02]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(classes, "block")}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
