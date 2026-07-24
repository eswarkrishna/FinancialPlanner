import { describe, expect, it } from "vitest";
import {
  computeEmi,
  isCurrentEmiTooLow,
  resolveKeepEmi,
} from "./emi";
import {
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
} from "./amortisation";

describe("resolveKeepEmi (§4.4.3, §10.100–101)", () => {
  it("defaults to the baseline formula EMI", () => {
    const formula = computeEmi(5_000_000, 7.9, 168);
    expect(resolveKeepEmi(5_000_000, 7.9, 168, "baseline", 0)).toBe(formula);
    expect(resolveKeepEmi(5_000_000, 7.9, 168)).toBe(formula);
  });

  it("uses current_emi_inr when basis is current and amount > 0", () => {
    expect(resolveKeepEmi(5_000_000, 7.9, 168, "current", 60_000)).toBe(60_000);
  });

  it("falls back to formula when current amount is 0", () => {
    const formula = computeEmi(5_000_000, 7.9, 168);
    expect(resolveKeepEmi(5_000_000, 7.9, 168, "current", 0)).toBe(formula);
  });
});

describe("schedulePrepayKeepEmi with current EMI override (§10.101)", () => {
  it("pays off sooner with a higher current EMI than baseline", () => {
    const baseline = schedulePrepayKeepEmi(5_000_000, 7.9, 168, 1, 2_500_000);
    const current = schedulePrepayKeepEmi(
      5_000_000,
      7.9,
      168,
      1,
      2_500_000,
      60_000,
    );
    expect(current.emi_inr).toBe(60_000);
    expect(current.totals.payoff_month).toBeLessThan(baseline.totals.payoff_month);
  });

  it("baseline override path matches the no-override call (§10.100)", () => {
    const formula = computeEmi(5_000_000, 7.9, 168);
    const a = schedulePrepayKeepEmi(5_000_000, 7.9, 168, 1, 2_500_000);
    const b = schedulePrepayKeepEmi(5_000_000, 7.9, 168, 1, 2_500_000, formula);
    expect(b.totals.payoff_month).toBe(a.totals.payoff_month);
    expect(b.totals.total_interest_inr).toBe(a.totals.total_interest_inr);
  });
});

describe("keep-tenure ignores current EMI (§10.103)", () => {
  it("schedulePrepayKeepTenure recomputes EMI after the prepay month", () => {
    const result = schedulePrepayKeepTenure(5_000_000, 7.9, 168, 1, 2_500_000);
    const formula = computeEmi(5_000_000, 7.9, 168);
    expect(result.totals.payoff_month).toBe(168);
    // Month 1 may still show the opening EMI; later months recompute from remaining balance.
    const laterEmi = result.rows[1]?.emi_inr ?? result.rows[0]?.emi_inr;
    expect(laterEmi).toBeDefined();
    expect(laterEmi).toBeLessThan(formula);
  });
});

describe("buildLoanModels current EMI (§10.103)", () => {
  it("keep-tenure totals are identical under baseline vs current emi_basis", async () => {
    const { buildLoanModels } = await import(
      "../../features/loan/hooks/buildLoanModels"
    );
    const { REFERENCE_SCENARIO_IN } = await import("../locale/constants");
    const baseline = buildLoanModels(
      { ...REFERENCE_SCENARIO_IN, emi_basis: "baseline" },
      "cash",
      0,
      [],
      "IN",
    );
    const current = buildLoanModels(
      {
        ...REFERENCE_SCENARIO_IN,
        emi_basis: "current",
        current_emi_inr: 60_000,
      },
      "cash",
      0,
      [],
      "IN",
    );
    expect(baseline.prepayTenure?.totals.payoff_month).toBe(
      current.prepayTenure?.totals.payoff_month,
    );
    expect(baseline.prepayTenure?.totals.total_interest_inr).toBe(
      current.prepayTenure?.totals.total_interest_inr,
    );
    expect(current.prepayEmi?.emi_inr).toBe(60_000);
    expect(baseline.prepayEmi?.emi_inr).not.toBe(60_000);
  });
});

describe("isCurrentEmiTooLow (§10.102)", () => {
  it("flags an EMI that cannot cover first-month interest", () => {
    expect(isCurrentEmiTooLow(5_000_000, 7.9, 1_000)).toBe(true);
    expect(isCurrentEmiTooLow(5_000_000, 7.9, 49_282.45)).toBe(false);
  });
});
