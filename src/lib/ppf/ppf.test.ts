import { describe, expect, it } from "vitest";
import { projectPpfMaturity } from "./project";

describe("projectPpfMaturity (§4.17, §10.60)", () => {
  it("matches reference golden: ₹1.5L/year, 7.1%, 15 years", () => {
    const result = projectPpfMaturity({
      opening_balance_inr: 0,
      annual_contribution_inr: 150_000,
      interest_rate_pct: 7.1,
      years: 15,
    });

    expect(result.maturity_value_inr).toBe(4_068_209.23);
    expect(result.total_contributed_inr).toBe(2_250_000);
    expect(result.total_interest_inr).toBe(1_818_209.23);
    expect(result.yearly).toHaveLength(15);
    expect(result.yearly[14]!.closing_inr).toBe(4_068_209.23);
  });

  it("warns when contribution exceeds annual limit (§10.61)", () => {
    const result = projectPpfMaturity({
      opening_balance_inr: 0,
      annual_contribution_inr: 200_000,
      interest_rate_pct: 7.1,
      years: 10,
    });
    expect(result.warnings).toContain("PPF_ABOVE_MAX");
  });

  it("warns when contribution is below minimum (§10.61)", () => {
    const result = projectPpfMaturity({
      opening_balance_inr: 0,
      annual_contribution_inr: 400,
      interest_rate_pct: 7.1,
      years: 10,
    });
    expect(result.warnings).toContain("PPF_BELOW_MIN");
  });

  it("includes opening balance in interest calculation", () => {
    const result = projectPpfMaturity({
      opening_balance_inr: 500_000,
      annual_contribution_inr: 150_000,
      interest_rate_pct: 7.1,
      years: 1,
    });
    expect(result.maturity_value_inr).toBe(696_150);
    expect(result.total_contributed_inr).toBe(150_000);
    expect(result.total_interest_inr).toBe(46_150);
  });
});
