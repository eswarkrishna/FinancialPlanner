import { describe, expect, it } from "vitest";
import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
} from "./loan/amortisation";

describe("baselineSchedule", () => {
  it("produces reference tenure length", () => {
    const { rows, totals, emi_inr } = baselineSchedule(5_000_000, 7.9, 168);
    expect(rows.length).toBe(168);
    expect(totals.payoff_month).toBe(168);
    expect(emi_inr).toBeCloseTo(49_282.45, 1);
  });
});

describe("schedulePrepayKeepEmi (SPEC §10 ~62 months)", () => {
  it("closes near month 62 after ₹25L prepay month 1", () => {
    const { totals } = schedulePrepayKeepEmi(5_000_000, 7.9, 168, 1, 2_500_000);
    expect(totals.payoff_month).toBeGreaterThanOrEqual(61);
    expect(totals.payoff_month).toBeLessThanOrEqual(63);
  });
});

describe("schedulePrepayKeepTenure", () => {
  it("runs full original tenure", () => {
    const { rows } = schedulePrepayKeepTenure(5_000_000, 7.9, 168, 1, 2_500_000);
    expect(rows.length).toBe(168);
  });
});

describe("scheduleFixedEmiWithMonthlyExtra", () => {
  it("closes faster than baseline when monthly extra > 0", () => {
    const base = baselineSchedule(5_000_000, 7.9, 168);
    const withExtra = scheduleFixedEmiWithMonthlyExtra(5_000_000, 7.9, 168, 75_000);
    expect(withExtra.totals.payoff_month).toBeLessThan(base.totals.payoff_month);
  });

  it("matches prepay+keep EMI when extra is 0 and one-time prepay only", () => {
    const a = schedulePrepayKeepEmi(5_000_000, 7.9, 168, 1, 2_500_000);
    const b = scheduleFixedEmiWithMonthlyExtra(5_000_000, 7.9, 168, 0, { month: 1, amount: 2_500_000 });
    expect(b.totals.payoff_month).toBe(a.totals.payoff_month);
  });
});
