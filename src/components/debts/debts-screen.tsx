"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HandCoins, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AddDebtSheet } from "@/components/debts/add-debt-sheet";
import { InviteFriendSheet } from "@/components/friends/invite-friend-sheet";
import { formatCurrency, formatYmdDate } from "@/lib/constants";
import type { DebtDto, DebtGroup, DebtSummary } from "@/lib/services/debts";
import { DEBT_STATUS } from "@/lib/social-constants";
import type { ApiResult } from "@/types/bill";
import { cn } from "@/lib/utils";

export function DebtsScreen({
  initialSummary,
  initialGroups,
  friendFilterId,
}: {
  initialSummary: DebtSummary;
  initialGroups: DebtGroup[];
  friendFilterId?: string | null;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [groups, setGroups] = useState(initialGroups);
  const [showSettled, setShowSettled] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const status = showSettled ? DEBT_STATUS.SETTLED : DEBT_STATUS.OPEN;
    const qs = new URLSearchParams({ grouped: "1", status });

    const [sumRes, listRes] = await Promise.all([
      fetch("/api/debts/summary"),
      fetch(`/api/debts?${qs.toString()}`),
    ]);
    const sumJson = (await sumRes.json()) as ApiResult<DebtSummary>;
    const listJson = (await listRes.json()) as ApiResult<DebtGroup[]>;
    if (sumJson.ok) setSummary(sumJson.data);
    if (listJson.ok) {
      let data = listJson.data;
      if (friendFilterId) {
        data = data.filter((g) => g.counterpartyUserId === friendFilterId);
      }
      setGroups(data);
    }
    router.refresh();
  }, [friendFilterId, router, showSettled]);

  async function loadSettled(next: boolean) {
    setShowSettled(next);
    const status = next ? DEBT_STATUS.SETTLED : DEBT_STATUS.OPEN;
    const qs = new URLSearchParams({ grouped: "1", status });
    if (friendFilterId) qs.set("friendUserId", friendFilterId);
    // For settled, groupDebts with settled status; for open, open.
    // friend filter: listDebts supports friendUserId but groupDebts doesn't —
    // filter client-side when friendFilterId set.
    const res = await fetch(`/api/debts?${qs.toString()}`);
    const json = (await res.json()) as ApiResult<DebtGroup[]>;
    if (json.ok) {
      let data = json.data;
      if (friendFilterId) {
        data = data.filter((g) => g.counterpartyUserId === friendFilterId);
      }
      setGroups(data);
    }
  }

  const visibleGroups = useMemo(() => {
    if (!friendFilterId) return groups;
    return groups.filter((g) => g.counterpartyUserId === friendFilterId);
  }, [friendFilterId, groups]);

  async function settle(debtId: string) {
    setSettlingId(debtId);
    try {
      const res = await fetch(`/api/debts/${debtId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: DEBT_STATUS.SETTLED }),
      });
      const json = (await res.json()) as ApiResult<DebtDto>;
      if (!json.ok) {
        toast.error(json.error);
        return;
      }
      toast.success("Marked settled");
      await refresh();
    } finally {
      setSettlingId(null);
    }
  }

  function onCreated() {
    void refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-5 pb-[calc(var(--bottom-nav-h)+1.5rem)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Debts</h2>
          <p className="text-sm text-muted-foreground">Money lent and borrowed.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/friends"
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium transition hover:bg-muted"
          >
            <Users className="size-3.5" />
            Friends
          </Link>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
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
          onClick={() => void loadSettled(!showSettled)}
          className="text-xs font-semibold text-primary"
        >
          {showSettled ? "Show open" : "Show settled"}
        </button>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-10 text-center shadow-sm ring-1 ring-foreground/5">
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
        <div className="space-y-4">
          {visibleGroups.map((group) => (
            <section
              key={group.key}
              className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="font-semibold text-foreground">{group.counterpartyName}</p>
                  {!showSettled && (
                    <p className="text-xs text-muted-foreground">
                      {group.netBalance > 0
                        ? `Owes you ${formatCurrency(group.netBalance)}`
                        : group.netBalance < 0
                          ? `You owe ${formatCurrency(Math.abs(group.netBalance))}`
                          : "Settled up"}
                    </p>
                  )}
                </div>
              </div>
              <ul className="divide-y divide-border">
                {group.debts.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-semibold tnum",
                          d.signedAmount >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {d.signedAmount >= 0 ? "+" : "−"}
                        {formatCurrency(d.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatYmdDate(d.occurredOn)}
                        {d.note ? ` · ${d.note}` : ""}
                      </p>
                    </div>
                    {d.status === DEBT_STATUS.OPEN && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={settlingId === d.id}
                        onClick={() => void settle(d.id)}
                      >
                        Settle
                      </Button>
                    )}
                    {d.status === DEBT_STATUS.SETTLED && (
                      <span className="text-xs font-medium text-muted-foreground">Settled</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AddDebtSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={onCreated}
        onAddFriend={() => {
          setAddOpen(false);
          setInviteOpen(true);
        }}
      />
      <InviteFriendSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </main>
  );
}
