import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the home billing layout. */
export default function HomeLoading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      <main className="flex-1 space-y-7 px-4 pb-44 pt-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
