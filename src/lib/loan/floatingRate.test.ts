import { describe, expect, it } from "vitest";
import { baselineSchedule } from "./amortisation";
import { loanRateConfigFrom } from "./rateSchedule";

describe("baselineSchedule floating rate (§4.3.1)", () => {
  const principal = 5_000_000;
  const tenure = 168;
  const initialRate = 7.9;

  it("matches fixed schedule when rate_type is fixed", () => {
    const fixed = baselineSchedule(principal, initialRate, tenure);
    const withConfig = baselineSchedule(
      principal,
      initialRate,
      tenure,
      loanRateConfigFrom(initialRate, "fixed", []),
    );
    expect(withConfig.totals).toEqual(fixed.totals);
    expect(withConfig.emi_inr).toBe(fixed.emi_inr);
  });

  it("increases total interest after a mid-tenure rate rise", () => {
    const fixed = baselineSchedule(principal, initialRate, tenure);
    const floating = baselineSchedule(
      principal,
      initialRate,
      tenure,
      loanRateConfigFrom(initialRate, "floating", [{ month: 13, annual_rate: 8.5 }]),
    );
    expect(floating.totals.total_interest_inr).toBeGreaterThan(
      fixed.totals.total_interest_inr,
    );
    expect(floating.rows[12]?.emi_inr).not.toBe(floating.rows[0]?.emi_inr);
  });
});
