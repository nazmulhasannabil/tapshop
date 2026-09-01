"use client";

import { useState } from "react";
import { HandCoins, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddDebtSheet } from "@/components/debts/add-debt-sheet";
import { InviteFriendSheet } from "@/components/friends/invite-friend-sheet";
import { formatCurrency, formatYmdDate } from "@/lib/constants";
import {
  useDebtGroups,
  useDebtsSummary,
  useSettleDebt,
} from "@/hooks/queries/use-debts";
import type { DebtGroup, DebtSummary } from "@/lib/services/debts";
import { DEBT_STATUS } from "@/lib/social-constants";
import { cn } from "@/lib/utils";

export function DebtsScreen({
  userId,
  initialSummary,
  initialGroups,
  friendFilterId,
}: {
  userId: string;
  initialSummary: DebtSummary;
  initialGroups: DebtGroup[];
  friendFilterId?: string | null;
}) {
  const [showSettled, setShowSettled] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: summary = initialSummary } = useDebtsSummary(userId, initialSummary);

  const openGroups = useDebtGroups(userId, {
    status: DEBT_STATUS.OPEN,
    friendUserId: friendFilterId ?? undefined,
    initialData: initialGroups,
    enabled: !showSettled,
  });

  const settledGroups = useDebtGroups(userId, {
    status: DEBT_STATUS.SETTLED,
    friendUserId: friendFilterId ?? undefined,
    enabled: showSettled,
  });

  const groups = showSettled ? settledGroups.data ?? [] : openGroups.data ?? initialGroups;
  const settleMutation = useSettleDebt(userId);

  async function settle(debtId: string) {
    try {
      await settleMutation.mutateAsync(debtId);
      toast.success("Marked settled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not settle debt.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-5 pb-[calc(var(--bottom-nav-h)+1.5rem)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Debts</h2>
          <p className="text-sm text-muted-foreground">Money lent and borrowed.</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            You are owed
          </p>
          <p className="mt-2 text-xl font-bold text-emerald-600 tnum dark:text-emerald-400">
            {formatCurrency(summary.youAreOwed)}
          </p>
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            You owe
          </p>
          <p className="mt-2 text-xl font-bold text-amber-700 tnum dark:text-amber-400">
            {formatCurrency(summary.youOwe)}
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Net{" "}
          <span
            className={cn(
              "font-semibold tnum",
              summary.net >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-700 dark:text-amber-400",
            )}
          >
            {summary.net >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(summary.net))}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setShowSettled((v) => !v)}
          className="text-xs font-semibold text-primary"
        >
          {showSettled ? "Show open" : "Show settled"}
        </button>
      </div>

      {(showSettled ? settledGroups.isLoading : false) ? (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
          <div className="h-16 animate-pulse bg-muted/60" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-10 text-center shadow-sm ring-1 ring-foreground/5">
          <HandCoins className="size-8 text-muted-foreground" />
          <p className="font-semibold text-foreground">
            {showSettled ? "No settled debts" : "No open debts"}
          </p>
          <p className="text-sm text-muted-foreground">
            Log what you lent or borrowed to keep balances clear.
          </p>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add debt
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
          <ul className="divide-y divide-border">
            {groups.flatMap((group) =>
              group.debts.map((d) => (
                <li key={d.id} className="flex items-center gap-2 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    <span className="shrink-0 font-semibold text-foreground">
                      {group.counterpartyName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {formatYmdDate(d.occurredOn)}
                      {d.note ? ` · ${d.note}` : ""}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tnum",
                      d.signedAmount >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {d.signedAmount >= 0 ? "+" : "−"}
                    {formatCurrency(d.amount)}
                  </span>
                  {d.status === DEBT_STATUS.OPEN ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={settleMutation.isPending && settleMutation.variables === d.id}
                      onClick={() => void settle(d.id)}
                    >
                      Settle
                    </Button>
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      Settled
                    </span>
                  )}
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <AddDebtSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        userId={userId}
        onAddFriend={() => {
          setAddOpen(false);
          setInviteOpen(true);
        }}
      />
      <InviteFriendSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </main>
  );
}
