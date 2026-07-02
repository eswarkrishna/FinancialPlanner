import { describe, expect, it } from "vitest";
import {
  simulateCashflowSchedule,
  simulateUePfToLoanCashflow,
} from "./cashflow";

describe("simulateCashflowSchedule (SPEC §4.8)", () => {
  it("tracks cash balance each month", () => {
    const result = simulateCashflowSchedule({
      principal_inr: 5_000_000,
      annual_interest_rate: 7.9,
      tenure_months: 168,
      cash_inr: 500_000,
      monthly_income_inr: 0,
      monthly_living_expense_inr: 50_000,
      monthly_extra_to_loan_inr: 0,
      unemployment_enabled: false,
      unemployment_start_month: 1,
      pf_corpus_inr: 0,
      pf_annual_interest_rate_pct: 8.25,
      monthly_pf_addition_inr: 0,
    });
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]!.cash_balance_inr).toBeLessThan(500_000);
    expect(result.min_cash_balance_inr).toBeLessThanOrEqual(result.rows[0]!.cash_balance_inr);
  });

  it("warns when unemployment has no cash runway for EMI", () => {
    const result = simulateCashflowSchedule({
      principal_inr: 5_000_000,
      annual_interest_rate: 7.9,
      tenure_months: 168,
      cash_inr: 0,
      monthly_income_inr: 0,
      monthly_living_expense_inr: 0,
      monthly_extra_to_loan_inr: 0,
      unemployment_enabled: true,
      unemployment_start_month: 1,
      pf_corpus_inr: 2_500_000,
      pf_annual_interest_rate_pct: 8.25,
      monthly_pf_addition_inr: 0,
      pf_tranche1_destination: "loan_prepay",
      pf_tranche2_destination: "loan_prepay",
    });
    expect(result.warnings).toContain("EMI_DEFAULT_RISK");
  });

  it("capitalizes unpaid interest when EMI is not fully paid (§4.8 skip_emi)", () => {
    const result = simulateCashflowSchedule({
      principal_inr: 1_000_000,
      annual_interest_rate: 12,
      tenure_months: 120,
      cash_inr: 5_000,
      monthly_income_inr: 0,
      monthly_living_expense_inr: 0,
      monthly_extra_to_loan_inr: 0,
      unemployment_enabled: false,
      unemployment_start_month: 1,
      pf_corpus_inr: 0,
      pf_annual_interest_rate_pct: 0,
      monthly_pf_addition_inr: 0,
    });
    expect(result.warnings).toContain("CASH_SHORTFALL");
    const month1 = result.rows[0]!;
    expect(month1.interest_inr).toBeGreaterThan(month1.principal_inr + month1.prepayment_inr);
    expect(month1.closing_inr).toBeGreaterThan(
      month1.opening_inr - month1.principal_inr,
    );
  });

  it("applies PF tranches to loan for UE_PF_TO_LOAN preset", () => {
    const result = simulateUePfToLoanCashflow({
      principal_inr: 5_000_000,
      annual_interest_rate: 7.9,
      tenure_months: 168,
      cash_inr: 2_500_000,
      monthly_income_inr: 0,
      monthly_living_expense_inr: 80_000,
      monthly_extra_to_loan_inr: 0,
      unemployment_start_month: 1,
      pf_corpus_inr: 2_500_000,
      pf_annual_interest_rate_pct: 8.25,
      monthly_pf_addition_inr: 0,
    });
    expect(result.totals.total_prepayments_inr).toBeGreaterThan(0);
    const month1 = result.rows.find((r) => r.month === 1);
    expect(month1?.events.some((e) => e.startsWith("pf_tranche1:loan"))).toBe(true);
  });
});
