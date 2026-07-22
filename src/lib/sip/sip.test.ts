import { describe, expect, it } from "vitest";
import { projectSipMaturity } from "./project";

describe("projectSipMaturity (§4.18, §10.65)", () => {
  it("matches reference golden: ₹10k/month, 12%, 10 years", () => {
    const result = projectSipMaturity({
      opening_balance_inr: 0,
      monthly_investment_inr: 10_000,
      expected_annual_return_pct: 12,
      years: 10,
    });

    expect(result.maturity_value_inr).toBe(2_300_386.88);
    expect(result.total_invested_inr).toBe(1_200_000);
    expect(result.total_gains_inr).toBe(1_100_386.88);
    expect(result.yearly).toHaveLength(10);
    expect(result.yearly[9]!.closing_inr).toBe(2_300_386.88);
  });

  it("warns when no contribution and no opening balance (§10.66)", () => {
    const result = projectSipMaturity({
      opening_balance_inr: 0,
      monthly_investment_inr: 0,
      expected_annual_return_pct: 12,
      years: 5,
    });
    expect(result.warnings).toContain("SIP_NO_CONTRIBUTION");
  });

  it("warns when years invalid", () => {
    const result = projectSipMaturity({
      opening_balance_inr: 0,
      monthly_investment_inr: 10_000,
      expected_annual_return_pct: 12,
      years: 0,
    });
    expect(result.warnings).toContain("SIP_INVALID_YEARS");
  });

  it("includes opening balance in gains calculation", () => {
    const result = projectSipMaturity({
      opening_balance_inr: 100_000,
      monthly_investment_inr: 10_000,
      expected_annual_return_pct: 12,
      years: 1,
    });
    expect(result.total_invested_inr).toBe(120_000);
    expect(result.maturity_value_inr).toBe(239_507.52);
    expect(result.total_gains_inr).toBe(19_507.52);
  });
});
