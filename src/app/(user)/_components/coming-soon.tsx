/**
 * Minimal placeholder screen for nav destinations that don't have a real
 * implementation yet. Centered, friendly, and clears the fixed bottom nav.
 */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 pb-28 text-center">
      <span className="text-5xl" aria-hidden>
        {icon}
      </span>
      <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
