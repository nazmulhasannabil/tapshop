import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton matching the debts layout. */
export default function DebtsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-5 pb-[calc(var(--bottom-nav-h)+1.5rem)]">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </div>
    </main>
  );
}
