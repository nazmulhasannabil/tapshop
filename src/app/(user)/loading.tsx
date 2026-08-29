import { Skeleton } from "@/components/ui/skeleton";

/**
 * Instant-loading skeleton for all authenticated user pages.
 *
 * Renders the header + bottom-nav chrome plus a pulsing content area so the
 * user never sees a blank white screen between navigations.
 */
export default function UserLoading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
      {/* Header skeleton */}
      <header className="border-b border-border/60 bg-background">
        <div className="flex h-14 w-full items-center justify-between px-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </header>

      {/* Content skeleton */}
      <main className="flex-1 space-y-7 px-4 pb-44 pt-6">
        {/* Today's bill card */}
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </main>

      {/* Bottom nav skeleton */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex h-[var(--bottom-nav-h)] w-full max-w-md items-stretch justify-around">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex flex-1 flex-col items-center justify-center gap-1">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
