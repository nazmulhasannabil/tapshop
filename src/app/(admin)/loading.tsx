import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeleton for admin pages.
 * Header and bottom nav stay mounted from the parent layout.
 */
export default function AdminLoading() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 pb-44 pt-6">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </main>
  );
}
