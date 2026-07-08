import { describe, expect, it } from "vitest";
import { computeEmi } from "./emi";
import { ErcBlockTracker } from "./erc";
import { giaNetDraw } from "./giaLiquidation";
import {
  simulateJlRedundancyToLoan,
  simulateUkBaseline,
  simulateUkCashflowSchedule,
} from "./cashflowUk";
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

  it("deducts scheduled payment from cash when job loss mode is off", () => {
    const r = simulateUkCashflowSchedule({
      ...ukCashflowBaseInput(
        {
          ...REFERENCE_SCENARIO_UK,
          cash_inr: 5_000,
          isa_balance_inr: 0,
          gia_balance_inr: 0,
          gia_cost_basis_inr: 0,
          redundancy_payment_inr: 0,
          monthly_uib_inr: 0,
        },
        0,
      ),
      extra_prepayments: [],
    });
    expect(r.rows[0]!.cash_balance_inr).toBeCloseTo(5_000 - r.emi_inr, 2);
  });

  it("uses liquid savings draws for employed prepay funding", () => {
    const r = simulateUkCashflowSchedule({
      ...ukCashflowBaseInput(
        {
          ...REFERENCE_SCENARIO_UK,
          cash_inr: 0,
          isa_balance_inr: 10_000,
          gia_balance_inr: 0,
          gia_cost_basis_inr: 0,
          redundancy_payment_inr: 0,
          monthly_uib_inr: 0,
        },
        0,
      ),
      extra_prepayments: [{ month: 1, amount_inr: 5_000 }],
    });
    expect(r.rows[0]!.prepayment_inr).toBe(5_000);
    expect(r.rows[0]!.events.some((e) => e.startsWith("draw:isa:"))).toBe(true);
  });

  it("does not double-debit cash after savings draw covers EMI", () => {
    const r = simulateUkCashflowSchedule({
      ...ukCashflowBaseInput(
        {
          ...REFERENCE_SCENARIO_UK,
          cash_inr: 500,
          isa_balance_inr: 1_000,
          gia_balance_inr: 0,
          gia_cost_basis_inr: 0,
          redundancy_payment_inr: 0,
          monthly_uib_inr: 0,
        },
        0,
      ),
      job_loss_enabled: true,
      extra_prepayments: [],
    });
    expect(r.rows[0]!.cash_balance_inr).toBeGreaterThanOrEqual(0);
  });

  it("clamps prepay to funded amount when draws cannot cover shortfall", () => {
    const r = simulateUkCashflowSchedule({
      ...ukCashflowBaseInput(
        {
          ...REFERENCE_SCENARIO_UK,
          principal_inr: 12_000,
          annual_interest_rate: 0,
          tenure_months: 12,
          cash_inr: 0,
          isa_balance_inr: 0,
          gia_balance_inr: 0,
          gia_cost_basis_inr: 0,
          redundancy_payment_inr: 0,
          monthly_uib_inr: 0,
        },
        0,
      ),
      job_loss_enabled: true,
      extra_prepayments: [{ month: 1, amount_inr: 5_000 }],
    });
    expect(r.rows[0]!.prepayment_inr).toBe(0);
  });

  it("resets CGT exemption each 12-month block", () => {
    const emi = computeEmi(1_000_000, 4, 360);
    const r = simulateUkCashflowSchedule({
      ...ukCashflowBaseInput(
        {
          ...REFERENCE_SCENARIO_UK,
          principal_inr: 1_000_000,
          annual_interest_rate: 4,
          tenure_months: 360,
          cash_inr: 0,
          isa_balance_inr: 0,
          gia_balance_inr: 100_000,
          gia_cost_basis_inr: 50_000,
          monthly_income_inr: emi,
          cgt_rate_pct: 20,
          cgt_annual_exempt_inr: 1_000,
          redundancy_payment_inr: 0,
          monthly_uib_inr: 0,
        },
        0,
      ),
      extra_prepayments: [
        { month: 1, amount_inr: 10_000 },
        { month: 13, amount_inr: 10_000 },
      ],
    });
    const taxForMonth = (month: number) => {
      const evt = r.rows[month - 1]!.events.find((e) => e.startsWith("gia:cgt:"));
      return evt ? Number(evt.split(":")[2]) : 0;
    };
    expect(taxForMonth(1)).toBeGreaterThan(0);
    expect(taxForMonth(13)).toBe(taxForMonth(1));
  });
});
