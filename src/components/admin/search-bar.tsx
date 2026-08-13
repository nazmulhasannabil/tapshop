"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** Large rounded search input with a search icon. */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search users by name or email",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground ring-1 ring-border transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
