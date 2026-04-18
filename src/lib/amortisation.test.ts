import { describe, expect, it } from "vitest";
import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
} from "./amortisation";
import { computePfUnemploymentWithdrawalPlan } from "./pf";

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

  it("does not throw when one-time prepay clears the balance early", () => {
    const run = () => schedulePrepayKeepTenure(5_000_000, 7.9, 168, 1, 50_000_000);
    expect(run).not.toThrow();
    const { totals } = run();
    expect(totals.payoff_month).toBeLessThanOrEqual(2);
  });

  it("closes faster when monthly recurring contribution is added", () => {
    const withoutRecurring = schedulePrepayKeepTenure(5_000_000, 7.9, 168, 1, 2_500_000, 0);
    const withRecurring = schedulePrepayKeepTenure(5_000_000, 7.9, 168, 1, 2_500_000, 50_000);
    expect(withRecurring.totals.payoff_month).toBeLessThan(withoutRecurring.totals.payoff_month);
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

describe("scheduleTimedPrepaysKeepEmi", () => {
  it("applies unemployment PF tranches on month 1 and month 12 (SPEC §4.7)", () => {
    const pfPlan = computePfUnemploymentWithdrawalPlan(2_500_000, 8.25);
    const result = scheduleTimedPrepaysKeepEmi(5_000_000, 7.9, 168, [
      { month: 1, amount_inr: pfPlan.tranche1_inr },
      { month: 12, amount_inr: pfPlan.tranche2_inr },
    ]);

    expect(result.rows[0]?.prepayment_inr).toBe(1_875_000);
    expect(result.rows[11]?.prepayment_inr).toBe(676_562.5);
    expect(result.totals.total_prepayments_inr).toBe(2_551_562.5);
  });

  it("closes faster than baseline for PF-to-loan unemployment scenario", () => {
    const baseline = baselineSchedule(5_000_000, 7.9, 168);
    const pfPlan = computePfUnemploymentWithdrawalPlan(2_500_000, 8.25);
    const uePfToLoan = scheduleTimedPrepaysKeepEmi(5_000_000, 7.9, 168, [
      { month: 1, amount_inr: pfPlan.tranche1_inr },
      { month: 12, amount_inr: pfPlan.tranche2_inr },
    ]);
    expect(uePfToLoan.totals.payoff_month).toBeLessThan(baseline.totals.payoff_month);
  });

  it("supports cash event + monthly cashflow, then PF on top", () => {
    const cashOnly = scheduleTimedPrepaysKeepEmi(5_000_000, 7.9, 168, [{ month: 1, amount_inr: 2_500_000 }], 75_000);
    const pfPlan = computePfUnemploymentWithdrawalPlan(2_500_000, 8.25);
    const cashPlusPf = scheduleTimedPrepaysKeepEmi(
      5_000_000,
      7.9,
      168,
      [
        { month: 1, amount_inr: 2_500_000 },
        { month: 1, amount_inr: pfPlan.tranche1_inr },
        { month: 12, amount_inr: pfPlan.tranche2_inr },
      ],
      75_000,
    );

    expect(cashOnly.rows[0]?.prepayment_inr).toBeGreaterThan(2_500_000);
    expect(cashPlusPf.rows[0]?.prepayment_inr).toBeGreaterThan(cashOnly.rows[0]?.prepayment_inr ?? 0);
    expect(cashPlusPf.totals.payoff_month).toBeLessThanOrEqual(cashOnly.totals.payoff_month);
  });
});
