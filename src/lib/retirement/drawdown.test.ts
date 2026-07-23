import { describe, expect, it } from "vitest";
import { projectRetirementDrawdown } from "./drawdown";

describe("projectRetirementDrawdown (§4.11.2, §10.88–90)", () => {
  it("matches reference golden: ₹10L corpus, ₹10k/mo withdrawal, 6% return → depletes year 12", () => {
    const result = projectRetirementDrawdown({
      corpus_at_retirement_inr: 1_000_000,
      monthly_withdrawal_inr: 10_000,
      post_retirement_return_pct: 6,
    });

    expect(result.depletion_year).toBe(12);
    expect(result.lasts_indefinitely).toBe(false);
    expect(result.yearly[0]).toEqual({
      year: 1,
      opening_inr: 1_000_000,
      growth_inr: 58_322.18,
      withdrawals_inr: 120_000,
      closing_inr: 938_322.18,
    });
  });

  it("reports indefinite when withdrawal is below growth (§10.89)", () => {
    const result = projectRetirementDrawdown({
      corpus_at_retirement_inr: 10_000_000,
      monthly_withdrawal_inr: 10_000,
      post_retirement_return_pct: 6,
    });

    expect(result.depletion_year).toBeNull();
    expect(result.lasts_indefinitely).toBe(true);
    expect(result.yearly[0]!.closing_inr).toBe(10_493_422.5);
  });

  it("warns when corpus at retirement is zero (§10.90)", () => {
    const result = projectRetirementDrawdown({
      corpus_at_retirement_inr: 0,
      monthly_withdrawal_inr: 10_000,
      post_retirement_return_pct: 6,
    });
    expect(result.warnings).toContain("DRAWDOWN_NO_CORPUS");
    expect(result.depletion_year).toBe(1);
  });
});
