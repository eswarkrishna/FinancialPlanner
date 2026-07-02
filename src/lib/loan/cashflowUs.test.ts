import { describe, expect, it } from "vitest";
import { computeEarlyWithdrawalCost } from "../k401/jobLoss";
import {
  simulateUsCashflowSchedule,
  simulateUs401kTranchesToLoanCashflow,
} from "./cashflowUs";

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

  it("reduces month-1 cash when PMI is active", () => {
    const withoutPmi = simulateUsCashflowSchedule(baseJobLossInput);
    const withPmi = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      pmi_monthly_inr: 200,
      pmi_active: true,
    });
    expect(withPmi.rows[0]?.cash_balance_inr).toBeLessThan(
      withoutPmi.rows[0]?.cash_balance_inr ?? 0,
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

  it("schedules tranche 2 at U + 11 when U is not 1", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      job_loss_start_month: 6,
      k401_balance_inr: 100_000,
      vested_fraction_pct: 100,
      k401_tranche1_destination: "loan_prepay",
      k401_tranche2_destination: "loan_prepay",
    });
    const tranche1Row = result.rows.find((r) =>
      r.events.some((e) => e.startsWith("k401_tranche1")),
    );
    const tranche2Row = result.rows.find((r) =>
      r.events.some((e) => e.startsWith("k401_tranche2")),
    );
    expect(tranche1Row?.month).toBe(6);
    expect(tranche2Row?.month).toBe(17);
  });

  it("applies early withdrawal penalty and net cash for 40k gross (SPEC-US §10)", () => {
    const cost = computeEarlyWithdrawalCost(40_000, 22);
    expect(cost.penalty_usd).toBe(4_000);
    expect(cost.net_to_cash_usd).toBe(27_200);

    const result = simulateUs401kTranchesToLoanCashflow({
      ...baseJobLossInput,
      cash_inr: 0,
      k401_balance_inr: 80_000,
      job_loss_start_month: 1,
    });
    expect(result.warnings).toContain("EARLY_401K_WITHDRAWAL");
    expect(result.total_early_withdrawal_penalty_inr).toBeGreaterThan(0);
  });

  it("does not apply monthly extra prepay without cash balance", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      cash_inr: 0,
      monthly_extra_to_loan_inr: 500,
      monthly_uib_inr: 0,
      monthly_living_expense_inr: 5_000,
    });
    expect(
      result.rows.some((r) => r.events.some((e) => e.startsWith("monthly_extra:"))),
    ).toBe(false);
  });

  it("does not amortize principal when EMI cannot be paid from cash", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      cash_inr: 100,
      monthly_living_expense_inr: 0,
    });
    const shortfallRow = result.rows.find((r) =>
      r.events.includes("payment_shortfall"),
    );
    expect(shortfallRow).toBeDefined();
    expect(shortfallRow?.principal_inr).toBe(0);
  });

  it("does not produce negative interest when cash is below zero before EMI", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      cash_inr: 1_000,
      monthly_living_expense_inr: 2_000,
    });
    expect(result.rows[0]?.interest_inr).toBeGreaterThanOrEqual(0);
    expect(result.rows[0]?.principal_inr).toBeGreaterThanOrEqual(0);
  });

  it("amortizes principal when bridge tranche covers EMI shortfall", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      cash_inr: 0,
      monthly_living_expense_inr: 0,
      k401_balance_inr: 100_000,
      vested_fraction_pct: 100,
      job_loss_enabled: true,
      k401_tranche1_destination: "cash_buffer",
      k401_tranche1_bridge_liquidity_first: true,
    });
    const bridgeRow = result.rows.find((r) =>
      r.events.some((e) => e.includes("k401_tranche1:payment_shortfall")),
    );
    expect(bridgeRow).toBeDefined();
    expect(bridgeRow?.principal_inr).toBeGreaterThan(0);
    expect(bridgeRow?.closing_inr).toBeLessThan(bridgeRow?.opening_inr ?? 0);
  });

  it("reports payoff_month 0 when loan is not paid off within horizon", () => {
    const result = simulateUsCashflowSchedule({
      ...baseJobLossInput,
      cash_inr: 0,
      monthly_uib_inr: 0,
      monthly_living_expense_inr: 5_000,
      tenure_months: 12,
    });
    expect(result.totals.payoff_month).toBe(0);
    expect(result.warnings).toContain("LOAN_NOT_PAID_OFF");
    expect(result.rows[result.rows.length - 1]?.closing_inr).toBeGreaterThan(0);
    expect(result.totals.total_interest_inr).toBeLessThan(1_000_000);
  });
});
