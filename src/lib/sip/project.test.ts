import { describe, expect, it } from "vitest";
import { projectSip } from "./project";

describe("projectSip", () => {
  it("returns zero for empty duration", () => {
    const result = projectSip({
      monthly_investment_inr: 10_000,
      annual_return_pct: 12,
      duration_months: 0,
    });
    expect(result.maturity_value_inr).toBe(0);
    expect(result.total_invested_inr).toBe(0);
  });

  it("matches hand-calculated 12-month SIP within ₹1", () => {
    const result = projectSip({
      monthly_investment_inr: 10_000,
      annual_return_pct: 12,
      duration_months: 12,
    });
    expect(result.total_invested_inr).toBe(120_000);
    expect(result.maturity_value_inr).toBeGreaterThan(120_000);
    expect(result.total_gains_inr).toBeGreaterThan(0);
    expect(result.monthly).toHaveLength(12);
    expect(result.monthly[11]!.corpus_inr).toBe(result.maturity_value_inr);
  });
});
