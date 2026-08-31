import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import { debtEntries } from "@/db/schema";
import {
  DEBT_DIRECTION,
  DEBT_STATUS,
  type DebtDirection,
} from "@/lib/social-constants";
import type { CreateDebtInput, UpdateDebtInput } from "@/lib/validations/debt";
import {
  getAcceptedFriend,
  getAcceptedFriendshipId,
} from "@/lib/services/friends";

const num = (v: string | number | null | undefined): number => Number(v ?? 0);

export type DebtDto = {
  id: string;
  createdBy: string;
  lenderUserId: string | null;
  borrowerUserId: string | null;
  lenderName: string;
  borrowerName: string;
  amount: number;
  currency: string;
  occurredOn: string;
  note: string | null;
  status: string;
  friendshipId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Viewer-relative: positive means counterparty owes viewer. */
  signedAmount: number;
  counterpartyName: string;
  counterpartyUserId: string | null;
};

export type DebtSummary = {
  youAreOwed: number;
  youOwe: number;
  net: number;
};

export type DebtGroup = {
  key: string;
  counterpartyName: string;
  counterpartyUserId: string | null;
  netBalance: number;
  debts: DebtDto[];
};

function toDto(
  row: typeof debtEntries.$inferSelect,
  viewerId: string,
): DebtDto {
  const amount = num(row.amount);

  let signedAmount = 0;
  let counterpartyName: string;
  let counterpartyUserId: string | null;

  if (row.lenderUserId === viewerId) {
    signedAmount = amount;
    counterpartyName = row.borrowerName;
    counterpartyUserId = row.borrowerUserId;
  } else if (row.borrowerUserId === viewerId) {
    signedAmount = -amount;
    counterpartyName = row.lenderName;
    counterpartyUserId = row.lenderUserId;
  } else {
    // Visibility allows createdBy; treat as free-text edge case.
    signedAmount = 0;
    counterpartyName = row.borrowerName;
    counterpartyUserId = row.borrowerUserId;
  }

  return {
    id: row.id,
    createdBy: row.createdBy,
    lenderUserId: row.lenderUserId,
    borrowerUserId: row.borrowerUserId,
    lenderName: row.lenderName,
    borrowerName: row.borrowerName,
    amount,
    currency: row.currency,
    occurredOn: row.occurredOn,
    note: row.note,
    status: row.status,
    friendshipId: row.friendshipId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    signedAmount,
    counterpartyName,
    counterpartyUserId,
  };
}

function visibleTo(userId: string) {
  return or(
    eq(debtEntries.createdBy, userId),
    eq(debtEntries.lenderUserId, userId),
    eq(debtEntries.borrowerUserId, userId),
  );
}

export async function listDebts(
  userId: string,
  opts: { status?: string; friendUserId?: string } = {},
): Promise<DebtDto[]> {
  const filters = [visibleTo(userId)];
  if (opts.status) filters.push(eq(debtEntries.status, opts.status));
  if (opts.friendUserId) {
    filters.push(
      or(
        and(
          eq(debtEntries.lenderUserId, userId),
          eq(debtEntries.borrowerUserId, opts.friendUserId),
        ),
        and(
          eq(debtEntries.lenderUserId, opts.friendUserId),
          eq(debtEntries.borrowerUserId, userId),
        ),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(debtEntries)
    .where(and(...filters))
    .orderBy(desc(debtEntries.occurredOn), desc(debtEntries.createdAt));

  return rows.map((r) => toDto(r, userId));
}

export async function groupDebts(
  userId: string,
  status: string = DEBT_STATUS.OPEN,
): Promise<DebtGroup[]> {
  const debts = await listDebts(userId, { status });
  const map = new Map<string, DebtGroup>();

  for (const d of debts) {
    const key = d.counterpartyUserId ?? `name:${d.counterpartyName.toLowerCase()}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        counterpartyName: d.counterpartyName,
        counterpartyUserId: d.counterpartyUserId,
        netBalance: 0,
        debts: [],
      };
      map.set(key, g);
    }
    g.debts.push(d);
    if (d.status === DEBT_STATUS.OPEN) g.netBalance += d.signedAmount;
  }

  return [...map.values()].sort(
    (a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance),
  );
}

export async function getDebtSummary(userId: string): Promise<DebtSummary> {
  const open = await listDebts(userId, { status: DEBT_STATUS.OPEN });
  let youAreOwed = 0;
  let youOwe = 0;
  for (const d of open) {
    if (d.signedAmount > 0) youAreOwed += d.signedAmount;
    else youOwe += Math.abs(d.signedAmount);
  }
  return { youAreOwed, youOwe, net: youAreOwed - youOwe };
}

export async function createDebt(
  userId: string,
  userName: string,
  input: CreateDebtInput,
): Promise<DebtDto> {
  const direction = input.direction as DebtDirection;
  const counterpartyUserId = input.counterpartyUserId ?? null;
  let counterpartyName = input.counterpartyName.trim();
  let friendshipId: string | null = null;

  if (counterpartyUserId) {
    const friend = await getAcceptedFriend(userId, counterpartyUserId);
    if (!friend) throw new Error("You can only link debts to accepted friends.");
    counterpartyName = friend.name;
    friendshipId = await getAcceptedFriendshipId(userId, counterpartyUserId);
  }

  let lenderUserId: string | null;
  let borrowerUserId: string | null;
  let lenderName: string;
  let borrowerName: string;

  if (direction === DEBT_DIRECTION.THEY_OWE_ME) {
    lenderUserId = userId;
    lenderName = userName;
    borrowerUserId = counterpartyUserId;
    borrowerName = counterpartyName;
  } else {
    borrowerUserId = userId;
    borrowerName = userName;
    lenderUserId = counterpartyUserId;
    lenderName = counterpartyName;
  }

  const [row] = await db
    .insert(debtEntries)
    .values({
      createdBy: userId,
      lenderUserId,
      borrowerUserId,
      lenderName,
      borrowerName,
      amount: input.amount.toFixed(2),
      currency: "BDT",
      occurredOn: input.occurredOn,
      note: input.note?.trim() || null,
      status: DEBT_STATUS.OPEN,
      friendshipId,
    })
    .returning();

  return toDto(row, userId);
}

export async function updateDebt(
  userId: string,
  debtId: string,
  input: UpdateDebtInput,
): Promise<DebtDto> {
  const existing = await db
    .select()
    .from(debtEntries)
    .where(eq(debtEntries.id, debtId))
    .limit(1);
  const row = existing[0];
  if (!row) throw new Error("Debt not found.");

  const canTouch =
    row.createdBy === userId ||
    row.lenderUserId === userId ||
    row.borrowerUserId === userId;
  if (!canTouch) throw new Error("Not allowed.");

  // Only creator can edit amount/note/date; either party can settle/cancel.
  if (
    (input.amount !== undefined || input.note !== undefined || input.occurredOn !== undefined) &&
    row.createdBy !== userId
  ) {
    throw new Error("Only the person who logged this can edit it.");
  }

  const patch: Partial<typeof debtEntries.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.status !== undefined) patch.status = input.status;
  if (input.amount !== undefined) patch.amount = input.amount.toFixed(2);
  if (input.note !== undefined) patch.note = input.note?.trim() || null;
  if (input.occurredOn !== undefined) patch.occurredOn = input.occurredOn;

  const [updated] = await db
    .update(debtEntries)
    .set(patch)
    .where(eq(debtEntries.id, debtId))
    .returning();

  return toDto(updated, userId);
}
