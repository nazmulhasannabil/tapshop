import { beforeEach, describe, expect, it } from "vitest";
import {
  billLines,
  computeTotals,
  displayedQty,
  useBillStore,
  type BillEntry,
} from "./bill-store";

const tea = (overrides: Partial<BillEntry> = {}): BillEntry => ({
  itemId: "a",
  name: "Tea",
  icon: "☕",
  unitPrice: 10,
  confirmed: 0,
  pending: 0,
  ...overrides,
});

const state = () => useBillStore.getState();

beforeEach(() => {
  useBillStore.setState({ entries: {}, hydrated: false });
});

describe("computeTotals", () => {
  it("sums quantity × unit price across entries", () => {
    const entries = {
      a: tea({ confirmed: 3 }),
      b: tea({ itemId: "b", name: "Burger", unitPrice: 80, confirmed: 1 }),
    };
    expect(computeTotals(entries)).toEqual({ count: 4, total: 110 });
  });

  it("includes optimistic pending deltas", () => {
    const entries = { a: tea({ confirmed: 2, pending: 1 }) };
    expect(computeTotals(entries)).toEqual({ count: 3, total: 30 });
  });

  it("ignores entries with zero displayed quantity", () => {
    const entries = { a: tea({ confirmed: 0, pending: 0 }) };
    expect(computeTotals(entries)).toEqual({ count: 0, total: 0 });
  });
});

describe("optimistic add flow", () => {
  it("displays +1 immediately then settles to the server value", () => {
    state().optimisticAdd({ itemId: "a", name: "Tea", icon: "☕", unitPrice: 10 });
    expect(displayedQty(state().entries.a)).toBe(1);
    expect(computeTotals(state().entries).total).toBe(10);

    state().confirmAdd("a", { quantity: 1, unitPrice: 10 });
    expect(displayedQty(state().entries.a)).toBe(1);
  });

  it("preserves the first add's unit price as a snapshot", () => {
    state().optimisticAdd({ itemId: "a", name: "Tea", icon: "☕", unitPrice: 10 });
    state().confirmAdd("a", { quantity: 1, unitPrice: 10 });
    // A later confirmation reports a different unit price; the stored snapshot wins.
    state().optimisticAdd({ itemId: "a", name: "Tea", icon: "☕", unitPrice: 10 });
    state().confirmAdd("a", { quantity: 2, unitPrice: 15 });
    expect(state().entries.a.unitPrice).toBe(10);
    expect(computeTotals(state().entries).total).toBe(20); // 2 × 10, not 15
  });

  it("rapid taps settle to the correct total even with out-of-order confirms", () => {
    for (let i = 0; i < 10; i++) {
      state().optimisticAdd({ itemId: "a", name: "Tea", icon: "☕", unitPrice: 10 });
    }
    expect(displayedQty(state().entries.a)).toBe(10);

    // The final tap's confirmation lands first (server qty 10)…
    state().confirmAdd("a", { quantity: 10, unitPrice: 10 });
    expect(displayedQty(state().entries.a)).toBe(10);

    // …then earlier stragglers (qty 1..9) arrive late — they must NOT reduce the count.
    for (let q = 1; q <= 9; q++) state().confirmAdd("a", { quantity: q, unitPrice: 10 });
    expect(displayedQty(state().entries.a)).toBe(10);
    expect(computeTotals(state().entries)).toEqual({ count: 10, total: 100 });
  });

  it("a failed add rolls back and prunes a brand-new entry", () => {
    state().optimisticAdd({ itemId: "a", name: "Tea", icon: "☕", unitPrice: 10 });
    state().failAdd("a");
    expect(state().entries.a).toBeUndefined();
  });
});

describe("decrease flow", () => {
  it("optimistically decreases then settles to the server value", () => {
    useBillStore.setState({
      hydrated: true,
      entries: { a: tea({ confirmed: 3 }) },
    });
    state().optimisticDecrease("a");
    expect(displayedQty(state().entries.a)).toBe(2);
    state().confirmDecrease("a", { quantity: 2 });
    expect(displayedQty(state().entries.a)).toBe(2);
  });

  it("decreasing to zero removes the entry", () => {
    useBillStore.setState({
      hydrated: true,
      entries: { a: tea({ confirmed: 1 }) },
    });
    state().optimisticDecrease("a");
    state().confirmDecrease("a", { quantity: 0 });
    expect(state().entries.a).toBeUndefined();
  });
});

describe("remove + restore", () => {
  it("removes optimistically and restores on failure", () => {
    const entry = tea({ confirmed: 2 });
    useBillStore.setState({ hydrated: true, entries: { a: entry } });

    const snapshot = state().entries.a;
    state().optimisticRemove("a");
    expect(state().entries.a).toBeUndefined();

    state().restore(snapshot);
    expect(displayedQty(state().entries.a)).toBe(2);
  });
});

describe("billLines", () => {
  it("returns active entries sorted by quantity descending", () => {
    useBillStore.setState({
      hydrated: true,
      entries: {
        a: tea({ confirmed: 1 }),
        b: tea({ itemId: "b", name: "Burger", confirmed: 3 }),
        c: tea({ itemId: "c", name: "Coffee", confirmed: 0 }),
      },
    });
    const lines = billLines(state().entries);
    expect(lines.map((l) => l.itemId)).toEqual(["b", "a"]);
  });
});
