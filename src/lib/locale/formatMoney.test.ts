import { describe, expect, it } from "vitest";
import { formatMoneyKpi } from "./formatMoney";

describe("formatMoneyKpi", () => {
  it("rounds INR headline KPIs to whole rupees", () => {
    expect(formatMoneyKpi(45_678.56, "IN")).toBe("₹45,679");
  });

  it("rounds USD headline KPIs to whole dollars", () => {
    expect(formatMoneyKpi(1234.4, "US")).toBe("$1,234");
  });
});
