import { describe, expect, it } from "vitest";
import { projectPpf } from "./project";

describe("projectPpf", () => {
  it("compounds annual interest after contribution", () => {
    const result = projectPpf({
      opening_balance_inr: 0,
      annual_contribution_inr: 150_000,
      annual_interest_rate_pct: 7.1,
      duration_years: 2,
    });
    expect(result.yearly).toHaveLength(2);
    expect(result.yearly[0]!.interest_inr).toBe(Math.round(150_000 * 0.071));
    expect(result.maturity_value_inr).toBeGreaterThan(300_000);
    expect(result.total_contributed_inr).toBe(300_000);
  });

  it("includes opening balance in maturity", () => {
    const result = projectPpf({
      opening_balance_inr: 500_000,
      annual_contribution_inr: 0,
      annual_interest_rate_pct: 7,
      duration_years: 1,
    });
    expect(result.maturity_value_inr).toBe(535_000);
  });
});
