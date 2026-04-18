import { describe, expect, it } from "vitest";
import { buildRetirementScenarios, projectRetirementCorpus } from "./retirement";

const baseInput = {
  current_corpus_inr: 1_000_000,
  monthly_contribution_inr: 30_000,
  annual_return_pct: 10,
  inflation_pct: 6,
  years_to_retirement: 20,
  annual_expense_today_inr: 800_000,
  safe_withdrawal_rate_pct: 4,
};

describe("projectRetirementCorpus", () => {
  it("increases projected corpus when monthly contribution increases", () => {
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
});

describe("buildRetirementScenarios", () => {
  it("keeps conservative funded ratio less than or equal to optimistic", () => {
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
