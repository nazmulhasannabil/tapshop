import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AdminUser } from "./types";

type UserCardProps = {
  user: AdminUser;
  className?: string;
};

/** Single-line user row: avatar with status, identity, and today's bill. */
export function UserCard({ user, className }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = user.status === "active";

  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      {/* Avatar + status pill overlapping top-right */}
      <div className="relative shrink-0">
        <Avatar className="size-11">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="bg-accent text-sm font-semibold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute right-0 top-0 z-10 size-3 rounded-full ring-2 ring-background",
            isActive ? "bg-success" : "bg-muted-foreground/40",
          )}
          aria-label={isActive ? "Active" : "Offline"}
        />
      </div>

      {/* Name + email */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {user.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      {/* Today's bill */}
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Today&apos;s Bill
        </p>
        <p className="mt-0.5 text-sm font-bold tnum text-foreground">
          {formatCurrency(user.todayBill)}
        </p>
      </div>
    </div>
  );
}
