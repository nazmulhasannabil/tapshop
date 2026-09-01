import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for the streamed saved-bills section on Activity. */
export function SavedBillsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
