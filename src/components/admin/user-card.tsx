import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AdminUser } from "./types";

type UserCardProps = {
  user: AdminUser;
  className?: string;
};

/** White rounded card showing a user's profile, status, and daily stats. */
export function UserCard({ user, className }: UserCardProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-4 ring-1 ring-border shadow-sm transition-shadow active:shadow-md",
        className,
      )}
    >
      {/* Profile row */}
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
          <AvatarFallback className="bg-accent text-sm font-semibold text-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
        {/* Status pill */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
            user.status === "active"
              ? "bg-success/10 text-success"
              : "bg-accent text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              user.status === "active" ? "bg-success" : "bg-muted-foreground/40",
            )}
          />
          {user.status === "active" ? "Active" : "Offline"}
        </span>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-border/60" />

      {/* Stats columns */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Today&apos;s Bill
          </p>
          <p className="mt-0.5 text-base font-bold tnum text-foreground">
            {formatCurrency(user.todayBill)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Total Items
          </p>
          <p className="mt-0.5 text-base font-bold tnum text-foreground">
            {user.totalItems}
          </p>
        </div>
      </div>
    </div>
  );
}
