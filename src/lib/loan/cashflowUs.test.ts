import { describe, expect, it } from "vitest";
import { simulateUsCashflowSchedule } from "./cashflowUs";

describe("simulateUsCashflowSchedule (SPEC-US §4.8)", () => {
  it("flags MORTGAGE_DEFAULT_RISK when job loss with no cash or UI", () => {
    const result = simulateUsCashflowSchedule({
      principal_inr: 400_000,
      annual_interest_rate: 6.5,
      tenure_months: 360,
      cash_inr: 0,
      monthly_income_inr: 0,
      monthly_living_expense_inr: 0,
      monthly_extra_to_loan_inr: 0,
      monthly_uib_inr: 0,
      job_loss_enabled: true,
      job_loss_start_month: 1,
      k401_balance_inr: 0,
      vested_fraction_pct: 100,
      early_withdrawal_tax_withholding_pct: 22,
    });
    expect(result.warnings).toContain("MORTGAGE_DEFAULT_RISK");
  });
});
