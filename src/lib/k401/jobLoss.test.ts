import { describe, expect, it } from "vitest";
import {
  computeEarlyWithdrawalCost,
  computeK401JobLossWithdrawalPlan,
  computeMonthlyEmployerMatchUsd,
} from "./jobLoss";

describe("computeK401JobLossWithdrawalPlan (SPEC-US §4.7)", () => {
  it("splits 50/50 at months U and U+11 for K0=100_000", () => {
    const plan = computeK401JobLossWithdrawalPlan(100_000);
    expect(plan.tranche1_gross_usd).toBe(50_000);
    expect(plan.tranche2_gross_usd).toBe(50_000);
    expect(plan.total_gross_usd).toBe(100_000);
  });

  it("applies vested fraction", () => {
    const plan = computeK401JobLossWithdrawalPlan(100_000, 60);
    expect(plan.vested_balance_usd).toBe(60_000);
    expect(plan.tranche1_gross_usd).toBe(30_000);
  });
});

describe("computeEarlyWithdrawalCost (SPEC-US §10)", () => {
  it("nets 27_200 on 40k gross at 10% penalty + 22% withholding", () => {
    const cost = computeEarlyWithdrawalCost(40_000);
    expect(cost.penalty_usd).toBe(4_000);
    expect(cost.withholding_usd).toBe(8_800);
    expect(cost.net_to_cash_usd).toBe(27_200);
  });
});

describe("computeMonthlyEmployerMatchUsd (SPEC-US §15)", () => {
  it("returns 300/mo for 120k salary, 1k deferral, 50%/6%", () => {
    const match = computeMonthlyEmployerMatchUsd({
      annual_salary_usd: 120_000,
      monthly_401k_deferral_usd: 1_000,
      employer_match_rate_pct: 50,
      employer_match_cap_pct_of_salary: 6,
    });
    expect(match).toBe(300);
  });
});
