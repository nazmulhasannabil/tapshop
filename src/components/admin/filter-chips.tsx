"use client";

import { cn } from "@/lib/utils";

type FilterChipsProps = {
  options: string[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Horizontal filter chip group — emerald active, dark inactive (Figma). */
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
            "shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-colors",
            active === option
              ? "bg-primary font-bold text-primary-foreground shadow-sm"
              : "border border-border bg-card text-slate-300 hover:text-white",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
