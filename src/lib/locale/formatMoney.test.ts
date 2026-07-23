import { describe, expect, it } from "vitest";
import { formatMoneyKpi } from "./formatMoney";

describe("formatMoneyKpi", () => {
  it("rounds INR headline KPIs to whole rupees with lakh suffix", () => {
    expect(formatMoneyKpi(45_678.56, "IN")).toBe("₹45,679");
    expect(formatMoneyKpi(5_000_000, "IN")).toBe("₹50,00,000 · 50 lakh");
    expect(formatMoneyKpi(25_000_000, "IN")).toBe("₹2,50,00,000 · 2.5 crore");
  });

  it("rounds USD headline KPIs to whole dollars", () => {
    expect(formatMoneyKpi(1234.4, "US")).toBe("$1,234");
  });
});
