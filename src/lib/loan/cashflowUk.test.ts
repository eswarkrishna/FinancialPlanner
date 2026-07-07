import { describe, expect, it } from "vitest";
import { computeEmi } from "./emi";
import { ErcBlockTracker } from "./erc";
import { giaNetDraw } from "./giaLiquidation";
import { simulateUkBaseline, simulateJlRedundancyToLoan } from "./cashflowUk";
import { netRedundancyGbp, computeAutoEnrolmentMonthly } from "../pension/autoEnrolment";
import { REFERENCE_SCENARIO_UK } from "../locale/constants";
import { ukCashflowBaseInput } from "../../features/loan/hooks/loanModelHelpers";

describe("SPEC-UK §10 acceptance", () => {
  it("1 — mortgage payment £250k @ 4.5% / 300 months", () => {
    const emi = computeEmi(250_000, 4.5, 300);
    expect(emi).toBeCloseTo(1389.58, 2);
  });

  it("4 — redundancy tax", () => {
    expect(netRedundancyGbp(40_000, 40)).toBe(36_000);
    expect(netRedundancyGbp(25_000, 40)).toBe(25_000);
  });

  it("8 — ERC on excess", () => {
    const tracker = new ErcBlockTracker(
      { overpayment_allowance_pct: 10, erc_pct: 2 },
      250_000,
    );
    tracker.beginMonth(1, 250_000);
    const r = tracker.recordPrepayment(37_500);
    expect(r.fee_gbp).toBe(250);
    const tracker0 = new ErcBlockTracker(
      { overpayment_allowance_pct: 10, erc_pct: 0 },
      250_000,
    );
    tracker0.beginMonth(1, 250_000);
    expect(tracker0.recordPrepayment(37_500).warning).toBe("ERC_ALLOWANCE_EXCEEDED");
  });

  it("11 — GIA CGT full liquidation", () => {
    const r = giaNetDraw(50_000, 50_000, 40_000, 24, 3_000);
    expect(r.tax_gbp).toBe(1680);
    expect(r.net_gbp).toBe(48_320);
  });

  it("auto-enrolment reference salary", () => {
    const ae = computeAutoEnrolmentMonthly(60_000, 5, 3, true);
    expect(ae.employee_monthly_gbp).toBeCloseTo(183.46, 2);
    expect(ae.employer_monthly_gbp).toBeCloseTo(110.08, 2);
  });

  it("UK baseline golden smoke", () => {
    const r = simulateUkBaseline(
      REFERENCE_SCENARIO_UK.principal_inr,
      REFERENCE_SCENARIO_UK.annual_interest_rate,
      REFERENCE_SCENARIO_UK.tenure_months,
    );
    expect(r.emi_inr).toBeCloseTo(1389.58, 2);
    expect(r.rows.length).toBe(300);
    expect(r.totals.payoff_month).toBe(300);
  });

  it("JL redundancy to loan runs", () => {
    const base = ukCashflowBaseInput(
      { ...REFERENCE_SCENARIO_UK, marginal_tax_rate_pct: 40 },
      0,
    );
    const r = simulateJlRedundancyToLoan({
      ...base,
      monthly_living_expense_inr: 2000,
    });
    expect(r.rows.length).toBeGreaterThan(0);
    expect(r.net_redundancy_inr).toBe(36_000);
  });
});
