import { describe, expect, it } from "vitest";
import {
  buildRetirementScenarios,
  DEFAULT_SAFE_WITHDRAWAL_RATE_PCT,
  projectRetirementCorpus,
} from "./retirement/index";
import { makeReferenceRetirementInput } from "../test/factories";

describe("projectRetirementCorpus", () => {
  it("increases projected corpus when monthly contribution increases", () => {
    const baseInput = makeReferenceRetirementInput();
    const low = projectRetirementCorpus({
      ...baseInput,
      monthly_contribution_inr: 20_000,
    });
    const high = projectRetirementCorpus({
      ...baseInput,
      monthly_contribution_inr: 40_000,
    });
    expect(high.projected_corpus_inr).toBeGreaterThan(low.projected_corpus_inr);
  });

  it("increases target corpus when inflation increases", () => {
    const baseInput = makeReferenceRetirementInput();
    const lowInflation = projectRetirementCorpus({
      ...baseInput,
      inflation_pct: 4,
    });
    const highInflation = projectRetirementCorpus({
      ...baseInput,
      inflation_pct: 8,
    });
    expect(highInflation.target_corpus_inr).toBeGreaterThan(
      lowInflation.target_corpus_inr,
    );
  });

  it("defaults safe withdrawal rate to 4% when unset (SPEC §4.11)", () => {
    const withDefault = projectRetirementCorpus({
      ...makeReferenceRetirementInput(),
      safe_withdrawal_rate_pct: 0,
    });
    const explicit = projectRetirementCorpus({
      ...makeReferenceRetirementInput(),
      safe_withdrawal_rate_pct: DEFAULT_SAFE_WITHDRAWAL_RATE_PCT,
    });
    expect(withDefault.target_corpus_inr).toBe(explicit.target_corpus_inr);
  });

  it("computes ss_adjusted_funded_ratio when Social Security is provided (SPEC-US §4.11)", () => {
    const projection = projectRetirementCorpus({
      ...makeReferenceRetirementInput(),
      expected_social_security_monthly_inr: 2_000,
      safe_withdrawal_rate_pct: 4,
      annual_expense_today_inr: 120_000,
      years_to_retirement: 20,
      inflation_pct: 6,
    });
    expect(projection.ss_adjusted_target_corpus_inr).toBeGreaterThan(0);
    expect(projection.ss_adjusted_funded_ratio).toBeGreaterThan(0);
    expect(projection.ss_adjusted_target_corpus_inr!).toBeLessThan(
      projection.target_corpus_inr,
    );
    expect(projection.ss_adjusted_funded_ratio!).toBeGreaterThan(
      projection.funded_ratio,
    );
  });
});

describe("buildRetirementScenarios", () => {
  it("keeps conservative funded ratio less than or equal to optimistic", () => {
    const baseInput = makeReferenceRetirementInput();
    const scenarios = buildRetirementScenarios(baseInput);
    const conservative = scenarios.find((item) => item.id === "conservative");
    const optimistic = scenarios.find((item) => item.id === "optimistic");
    expect(conservative).toBeTruthy();
    expect(optimistic).toBeTruthy();
    expect(conservative?.projection.funded_ratio ?? 0).toBeLessThanOrEqual(
      optimistic?.projection.funded_ratio ?? 0,
    );
  });
});
