"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { FloatingActionButton } from "./floating-action-button";
import { FilterChips } from "./filter-chips";
import { SearchBar } from "./search-bar";
import { UserCard } from "./user-card";
import type { AdminUser } from "./types";

const FILTER_OPTIONS = ["All", "Active", "Offline"];

type UsersScreenProps = {
  users: AdminUser[];
};

/** Admin user list with search, filter chips, and a floating add button. */
export function UsersScreen({ users }: UsersScreenProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      // Filter by status
      if (filter === "Active" && u.status !== "active") return false;
      if (filter === "Offline" && u.status !== "offline") return false;
      // Filter by search
      if (search) {
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, filter]);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col bg-background px-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+1.5rem)]">
      {/* Intro */}
      <div className="space-y-1 pb-4 pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Users
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Manage and monitor your shop users.
        </p>
      </div>

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Filter chips */}
      <FilterChips
        options={FILTER_OPTIONS}
        active={filter}
        onChange={setFilter}
        className="mt-3"
      />

      {/* User list */}
      <div className="mt-4 space-y-3">
        {filtered.length > 0 ? (
          filtered.map((user) => (
            <Link key={user.id} href={`/users/${user.id}`}>
              <UserCard user={user} />
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 text-sm font-medium text-foreground">
              No users found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or filter.
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <FloatingActionButton
        onClick={() => {
          /* TODO: open add-user dialog */
        }}
        aria-label="Add new user"
      />
    </div>
  );
}
