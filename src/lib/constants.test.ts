import { describe, expect, it } from "vitest";
import { formatCurrency, formatRelativeTime, todayKey } from "./constants";

describe("formatCurrency", () => {
  it("prefixes the taka symbol and groups thousands", () => {
    expect(formatCurrency(240)).toBe("৳240");
    expect(formatCurrency(123456)).toBe("৳123,456");
  });

  it("keeps fractional taka without trailing zeros", () => {
    expect(formatCurrency(80.5)).toBe("৳80.5");
    expect(formatCurrency(10.25)).toBe("৳10.25");
  });

  it("treats non-finite input as zero", () => {
    expect(formatCurrency(Number.NaN)).toBe("৳0");
  });
});

describe("todayKey", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayKey(new Date("2026-08-12T10:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-12T12:00:00Z");
  it("formats recent times", () => {
    expect(formatRelativeTime(new Date("2026-08-12T11:59:35Z"), now)).toBe("just now");
    expect(formatRelativeTime(new Date("2026-08-12T11:55:00Z"), now)).toBe("5m ago");
    expect(formatRelativeTime(new Date("2026-08-12T10:00:00Z"), now)).toBe("2h ago");
  });
});
