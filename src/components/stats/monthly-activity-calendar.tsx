"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/constants";
import type { MonthDayTotal } from "@/lib/services/stats";

const CHART_HEIGHT = 200;
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SWIPE_THRESHOLD_PX = 48;

/** Level 0 = empty; 1–4 = light → dark green relative to month max. */
function intensityLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted",
  1: "bg-success/25",
  2: "bg-success/45",
  3: "bg-success/70",
  4: "bg-success",
};

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

/** Mon=0 … Sun=6 for a YYYY-MM-DD string (UTC calendar, no TZ shift). */
function mondayBasedWeekday(ymd: string): number {
  const { y, m, d } = parseYmd(ymd);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
  return (dow + 6) % 7;
}

function todayYmd(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function currentMonthKey(): string {
  return todayYmd().slice(0, 7);
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** Unique YYYY-MM keys in chronological order from a flat day series. */
function monthKeysFromData(data: MonthDayTotal[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const d of data) {
    const key = d.date.slice(0, 7);
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

type Cell =
  | { kind: "empty"; key: string }
  | { kind: "day"; key: string; date: string; value: number; future: boolean };

function buildGrid(monthDays: MonthDayTotal[], today: string): {
  weekCount: number;
  gridCells: Cell[];
} {
  const cells: Cell[] = [];
  if (monthDays.length > 0) {
    const first = monthDays[0]!;
    const lead = mondayBasedWeekday(first.date);
    for (let i = 0; i < lead; i++) {
      cells.push({ kind: "empty", key: `lead-${i}` });
    }
    for (const day of monthDays) {
      cells.push({
        kind: "day",
        key: day.date,
        date: day.date,
        value: day.value,
        future: day.date > today,
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ kind: "empty", key: `trail-${cells.length}` });
    }
  }

  const weekCount = Math.max(1, Math.ceil(cells.length / 7));
  const gridCells: Cell[] = [];
  for (let row = 0; row < 7; row++) {
    for (let week = 0; week < weekCount; week++) {
      gridCells.push(
        cells[week * 7 + row] ?? { kind: "empty", key: `pad-${week}-${row}` },
      );
    }
  }
  return { weekCount, gridCells };
}

/**
 * GitHub-style contribution calendar with month picker + horizontal swipe.
 * Data covers past months through next month (from getStats).
 */
export function MonthlyActivityCalendar({ data }: { data: MonthDayTotal[] }) {
  const today = todayYmd();
  const months = useMemo(() => monthKeysFromData(data), [data]);
  const [selectedMonth, setSelectedMonth] = useState(
    () => currentMonthKey(),
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  // Keep selection valid when data refreshes or month rolls over.
  const activeMonth = months.includes(selectedMonth)
    ? selectedMonth
    : (months.find((m) => m === currentMonthKey()) ?? months[months.length - 1] ?? currentMonthKey());

  const monthDays = useMemo(
    () => data.filter((d) => d.date.startsWith(activeMonth)),
    [data, activeMonth],
  );

  const max = monthDays.reduce((m, d) => Math.max(m, d.value), 0);
  const { weekCount, gridCells } = buildGrid(monthDays, today);

  const monthIndex = months.indexOf(activeMonth);
  const canPrev = monthIndex > 0;
  const canNext = monthIndex >= 0 && monthIndex < months.length - 1;

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  function goToMonthOffset(delta: number) {
    const next = months[monthIndex + delta];
    if (next) setSelectedMonth(next);
  }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Prefer horizontal swipes; ignore mostly-vertical scrolls.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goToMonthOffset(1); // swipe left → next month
    else goToMonthOffset(-1); // swipe right → previous month
  }

  return (
    <div
      className="flex touch-pan-y flex-col justify-center select-none"
      style={{ minHeight: CHART_HEIGHT }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-foreground transition hover:bg-accent"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          {monthLabel(activeMonth)}
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={`size-2.5 rounded-[2px] ${LEVEL_CLASS[level]}`}
              aria-hidden
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-2">
        <div
          className="grid shrink-0 gap-1"
          style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
        >
          {WEEKDAY_LABELS.map((label, i) => (
            <span
              key={label}
              className={`flex items-center text-[10px] leading-none text-muted-foreground ${
                i % 2 === 1 ? "invisible" : ""
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        <div
          className="grid flex-1 gap-1"
          style={{
            gridTemplateColumns: `repeat(${weekCount}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          }}
        >
          {gridCells.map((cell) => {
            if (cell.kind === "empty") {
              return (
                <div
                  key={cell.key}
                  className="aspect-square w-full max-h-7 rounded-[3px] bg-transparent"
                  aria-hidden
                />
              );
            }

            const level = cell.future ? 0 : intensityLevel(cell.value, max);
            const tip = cell.future
              ? `${cell.date} — upcoming`
              : `${cell.date} — ${formatCurrency(cell.value)}`;

            return (
              <div
                key={cell.key}
                title={tip}
                className={`aspect-square w-full max-h-7 rounded-[3px] ${LEVEL_CLASS[level]} ${
                  cell.date === today
                    ? "ring-1 ring-foreground/40 ring-offset-1 ring-offset-card"
                    : ""
                }`}
                aria-label={tip}
              />
            );
          })}
        </div>
      </div>

      {(canPrev || canNext) && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Swipe to change month
        </p>
      )}

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh] gap-0 rounded-t-3xl p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="text-center text-base">Select month</SheetTitle>
          </SheetHeader>
          <ul className="max-h-[55dvh] overflow-y-auto px-2 py-2">
            {[...months].reverse().map((key) => {
              const selected = key === activeMonth;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth(key);
                      setPickerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition hover:bg-accent ${
                      selected ? "bg-accent font-semibold text-foreground" : "text-foreground"
                    }`}
                  >
                    <span>
                      {monthLabel(key)}
                      {key === currentMonthKey() ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Current
                        </span>
                      ) : null}
                    </span>
                    {selected ? (
                      <Check className="size-4 text-success" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
}
