import { describe, expect, it } from "vitest";
import {
  buildRetirementScenarios,
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
