import { describe, expect, it } from "vitest";
import { simulateUsCashflowSchedule } from "./cashflowUs";

const baseJobLossInput = {
  principal_inr: 400_000,
  annual_interest_rate: 6.5,
  tenure_months: 360,
  cash_inr: 10_000,
  monthly_income_inr: 0,
  monthly_living_expense_inr: 0,
  monthly_extra_to_loan_inr: 0,
  monthly_uib_inr: 0,
  job_loss_enabled: true,
  job_loss_start_month: 1,
  k401_balance_inr: 0,
  vested_fraction_pct: 100,
  early_withdrawal_tax_withholding_pct: 22,
};

describe("simulateUsCashflowSchedule (SPEC-US §4.8)", () => {
  it("flags MORTGAGE_DEFAULT_RISK when job loss with no cash or UI", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      cash_inr: 0,
    });
    expect(result.warnings).toContain("MORTGAGE_DEFAULT_RISK");
  });

  it("reduces min cash when PMI is active", () => {
    const withoutPmi = simulateUsCashflowSchedule(baseJobLossInput);
    const withPmi = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      pmi_monthly_inr: 200,
      pmi_active: true,
    });
    expect(withPmi.min_cash_balance_inr).toBeLessThan(
      withoutPmi.min_cash_balance_inr,
    );
    expect(withPmi.rows[0]?.events.some((e) => e.startsWith("pmi:-200"))).toBe(
      true,
    );
  });

  it("draws health premium from HSA tax-free during job loss", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      hsa_balance_inr: 500,
      monthly_health_premium_inr: 400,
    });
    expect(result.rows[0]?.events).toContain("hsa:premium:400");
    expect(
      result.rows[0]?.events.some((e) => e.startsWith("health_premium:cash:")),
    ).toBe(false);
  });

  it("uses cash for health premium remainder when HSA is insufficient", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      hsa_balance_inr: 200,
      monthly_health_premium_inr: 400,
    });
    expect(result.rows[0]?.events).toContain("hsa:premium:200");
    expect(result.rows[0]?.events).toContain("health_premium:cash:200");
  });
});
