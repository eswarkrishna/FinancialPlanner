import { describe, expect, it } from "vitest";
import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
} from "./loan";
import { computePfUnemploymentWithdrawalPlan } from "./pf/index";
import {
  makeReferenceLoanInput,
  makeReferencePfInput,
  makeReferencePrepayInput,
} from "../test/factories";

describe("baselineSchedule", () => {
  it("produces reference tenure length", () => {
    const loan = makeReferenceLoanInput();
    const { rows, totals, emi_inr } = baselineSchedule(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
    );
    expect(rows.length).toBe(168);
    expect(totals.payoff_month).toBe(168);
    expect(emi_inr).toBeCloseTo(49_282.45, 1);
  });

  it("keeps baseline interest within 0.1% of reference workbook value", () => {
    const loan = makeReferenceLoanInput();
    const expectedInterestInr = 3_279_451.26;
    const { totals } = baselineSchedule(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
    );
    const allowedDelta = expectedInterestInr * 0.001;
    const delta = Math.abs(totals.total_interest_inr - expectedInterestInr);
    expect(delta).toBeLessThanOrEqual(allowedDelta);
  });
});

describe("schedulePrepayKeepEmi (SPEC §10 ~62 months)", () => {
  it("closes near month 62 after ₹25L prepay month 1", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const { totals } = schedulePrepayKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
    );
    expect(totals.payoff_month).toBeGreaterThanOrEqual(61);
    expect(totals.payoff_month).toBeLessThanOrEqual(63);
  });
});

describe("schedulePrepayKeepTenure", () => {
  it("runs full original tenure", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const { rows } = schedulePrepayKeepTenure(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
    );
    expect(rows.length).toBe(168);
  });

  it("does not throw when one-time prepay clears the balance early", () => {
    const loan = makeReferenceLoanInput();
    const run = () =>
      schedulePrepayKeepTenure(
        loan.principal_inr,
        loan.annual_interest_rate,
        loan.tenure_months,
        1,
        50_000_000,
      );
    expect(run).not.toThrow();
    const { totals } = run();
    expect(totals.payoff_month).toBeLessThanOrEqual(2);
  });

  it("closes faster when monthly recurring contribution is added", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const withoutRecurring = schedulePrepayKeepTenure(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
      0,
    );
    const withRecurring = schedulePrepayKeepTenure(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
      50_000,
    );
    expect(withRecurring.totals.payoff_month).toBeLessThan(withoutRecurring.totals.payoff_month);
  });

  it("keeps tenure but lowers recomputed EMI to around half baseline", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const base = baselineSchedule(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
    );
    const keepTenure = schedulePrepayKeepTenure(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
    );
    const month12Emi = keepTenure.rows[11]?.emi_inr ?? 0;
    expect(Math.abs(month12Emi - base.emi_inr / 2)).toBeLessThanOrEqual(100);
  });
});

describe("scheduleFixedEmiWithMonthlyExtra", () => {
  it("closes faster than baseline when monthly extra > 0", () => {
    const loan = makeReferenceLoanInput();
    const base = baselineSchedule(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
    );
    const withExtra = scheduleFixedEmiWithMonthlyExtra(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      75_000,
    );
    expect(withExtra.totals.payoff_month).toBeLessThan(base.totals.payoff_month);
  });

  it("matches prepay+keep EMI when extra is 0 and one-time prepay only", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const a = schedulePrepayKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      prepay.prepay_month,
      prepay.prepay_inr,
    );
    const b = scheduleFixedEmiWithMonthlyExtra(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      0,
      { month: prepay.prepay_month, amount: prepay.prepay_inr },
    );
    expect(b.totals.payoff_month).toBe(a.totals.payoff_month);
  });
});

describe("scheduleTimedPrepaysKeepEmi", () => {
  it("applies unemployment PF tranches on month 1 and month 12 (SPEC §4.7)", () => {
    const loan = makeReferenceLoanInput();
    const pf = makeReferencePfInput();
    const pfPlan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
    );
    const result = scheduleTimedPrepaysKeepEmi(loan.principal_inr, loan.annual_interest_rate, loan.tenure_months, [
      { month: 1, amount_inr: pfPlan.tranche1_inr },
      { month: 12, amount_inr: pfPlan.tranche2_inr },
    ]);

    expect(result.rows[0]?.prepayment_inr).toBe(1_875_000);
    expect(result.rows[11]?.prepayment_inr).toBe(676_562.5);
    expect(result.totals.total_prepayments_inr).toBe(2_551_562.5);
  });

  it("closes faster than baseline for PF-to-loan unemployment scenario", () => {
    const loan = makeReferenceLoanInput();
    const pf = makeReferencePfInput();
    const baseline = baselineSchedule(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
    );
    const pfPlan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
    );
    const uePfToLoan = scheduleTimedPrepaysKeepEmi(loan.principal_inr, loan.annual_interest_rate, loan.tenure_months, [
      { month: 1, amount_inr: pfPlan.tranche1_inr },
      { month: 12, amount_inr: pfPlan.tranche2_inr },
    ]);
    expect(uePfToLoan.totals.payoff_month).toBeLessThan(baseline.totals.payoff_month);
  });

  it("supports cash event + monthly cashflow, then PF on top", () => {
    const loan = makeReferenceLoanInput();
    const prepay = makeReferencePrepayInput();
    const pf = makeReferencePfInput();
    const cashOnly = scheduleTimedPrepaysKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      [{ month: 1, amount_inr: prepay.prepay_inr }],
      75_000,
    );
    const pfPlan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
    );
    const cashPlusPf = scheduleTimedPrepaysKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      [
        { month: 1, amount_inr: prepay.prepay_inr },
        { month: 1, amount_inr: pfPlan.tranche1_inr },
        { month: 12, amount_inr: pfPlan.tranche2_inr },
      ],
      75_000,
    );

    expect(cashOnly.rows[0]?.prepayment_inr).toBeGreaterThan(2_500_000);
    expect(cashPlusPf.rows[0]?.prepayment_inr).toBeGreaterThan(cashOnly.rows[0]?.prepayment_inr ?? 0);
    expect(cashPlusPf.totals.payoff_month).toBeLessThanOrEqual(cashOnly.totals.payoff_month);
  });

  it("reduces payoff month when monthly salary contribution is applied", () => {
    const loan = makeReferenceLoanInput();
    const pf = makeReferencePfInput();
    const pfPlan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
    );
    const withoutSalary = scheduleTimedPrepaysKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      [
        { month: 1, amount_inr: pfPlan.tranche1_inr },
        { month: 12, amount_inr: pfPlan.tranche2_inr },
      ],
      0,
    );
    const withSalary = scheduleTimedPrepaysKeepEmi(
      loan.principal_inr,
      loan.annual_interest_rate,
      loan.tenure_months,
      [
        { month: 1, amount_inr: pfPlan.tranche1_inr },
        { month: 12, amount_inr: pfPlan.tranche2_inr },
      ],
      30_000,
    );
    expect(withSalary.totals.payoff_month).toBeLessThanOrEqual(
      withoutSalary.totals.payoff_month,
    );
  });
});
