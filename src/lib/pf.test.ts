import { describe, expect, it } from "vitest";
import {
  computePfUnemploymentWithdrawalPlan,
  DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT,
} from "./pf/index";
import { makeReferencePfInput } from "../test/factories";

describe("computePfUnemploymentWithdrawalPlan", () => {
  it("matches SPEC §10 PF reference amounts with 8.25% annual credit", () => {
    const pf = makeReferencePfInput();
    const plan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
    );
    expect(DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT).toBe(8.25);
    expect(plan.tranche1_inr).toBe(1_875_000);
    expect(plan.tranche2_inr).toBe(676_562.5);
    expect(plan.total_withdrawn_inr).toBe(2_551_562.5);
  });

  it("returns the old split when annual PF interest is 0%", () => {
    const pf = makeReferencePfInput();
    const plan = computePfUnemploymentWithdrawalPlan(pf.pf_corpus_inr, 0);
    expect(plan.tranche1_inr).toBe(1_875_000);
    expect(plan.tranche2_inr).toBe(625_000);
    expect(plan.total_withdrawn_inr).toBe(2_500_000);
  });

  it("adds monthly PF contributions before month-12 tranche", () => {
    const pf = makeReferencePfInput({ monthly_pf_addition_inr: 10_000 });
    const plan = computePfUnemploymentWithdrawalPlan(
      pf.pf_corpus_inr,
      pf.pf_annual_interest_rate_pct,
      pf.monthly_pf_addition_inr,
    );
    expect(plan.tranche1_inr).toBe(1_875_000);
    expect(plan.tranche2_inr).toBe(806_462.5);
    expect(plan.total_withdrawn_inr).toBe(2_681_462.5);
  });
});
