import { Skeleton } from "@/components/ui/skeleton";
import { SavedBillsSkeleton } from "@/components/activity/saved-bills-skeleton";

/** Skeleton matching the activity layout. */
export default function ActivityLoading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <main className="flex-1 space-y-8 px-4 pb-28 pt-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-36" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <SavedBillsSkeleton />
      </main>
    </div>
  );
}
