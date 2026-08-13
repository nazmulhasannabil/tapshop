import { cn } from "@/lib/utils";

type FloatingActionButtonProps = {
  onClick: () => void;
  className?: string;
  "aria-label"?: string;
};

/** Fixed-position floating action button (indigo + icon). */
export function FloatingActionButton({
  onClick,
  className,
  "aria-label": ariaLabel = "Add",
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "fixed bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.25rem)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </button>
  );
}
