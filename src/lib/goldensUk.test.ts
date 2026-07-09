import { describe, expect, it } from "vitest";
import baseGolden from "../test/fixtures/goldens-uk/BASE.json";
import prepayTenureGolden from "../test/fixtures/goldens-uk/PREPAY_CASH_25K_TENURE.json";
import jlGolden from "../test/fixtures/goldens-uk/JL_REDUNDANCY_TO_LOAN.json";
import { computeUkGoldenScenarios } from "../test/fixtures/goldens-uk/buildGoldensUk";

describe("UK golden fixtures (SPEC-UK §10)", () => {
  it("BASE matches computed snapshot", () => {
    const computed = computeUkGoldenScenarios().BASE;
    expect(computed.totals.payoff_month).toBe(baseGolden.totals.payoff_month);
    expect(computed.totals.total_interest_inr).toBeCloseTo(
      baseGolden.totals.total_interest_inr,
      0,
    );
  });

  it("PREPAY_CASH_25K_TENURE shortens payoff vs BASE", () => {
    const computed = computeUkGoldenScenarios();
    expect(computed.PREPAY_CASH_25K_TENURE.totals.payoff_month).toBeLessThan(
      computed.BASE.totals.payoff_month,
    );
    expect(computed.PREPAY_CASH_25K_TENURE.totals.payoff_month).toBe(
      prepayTenureGolden.totals.payoff_month,
    );
  });

  it("JL_REDUNDANCY_TO_LOAN golden stable", () => {
    const computed = computeUkGoldenScenarios().JL_REDUNDANCY_TO_LOAN;
    expect(computed.totals.total_prepayments_inr).toBe(
      jlGolden.totals.total_prepayments_inr,
    );
  });
});
