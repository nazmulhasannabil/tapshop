"use client";

import { cn } from "@/lib/utils";

type FilterChipsProps = {
  options: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Horizontal filter chip group with indigo active state. */
export function FilterChips({
  options,
  active,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
            active === option
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-foreground hover:bg-accent/80",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
