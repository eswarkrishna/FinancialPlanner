import { describe, expect, it } from "vitest";
import {
  corpusSeriesLabel,
  deflateToToday,
  drawdownBalanceForMode,
  projectedCorpusForMode,
  realFundedRatio,
  realTargetCorpus,
  yearlyCorpusForMode,
} from "./display";
import { projectRetirementCorpus } from "./project";
import { makeReferenceRetirementInput } from "../../test/factories";

describe("retirement display (§4.11.3, §10.91–93)", () => {
  it("labels nominal vs real series (§10.91)", () => {
    expect(corpusSeriesLabel("nominal")).toBe("Nominal");
    expect(corpusSeriesLabel("real")).toBe("Real (today's value)");
  });

  it("selects projected corpus by display mode (§10.92)", () => {
    const projection = projectRetirementCorpus(makeReferenceRetirementInput());
    expect(projectedCorpusForMode(projection, "nominal")).toBe(
      projection.projected_corpus_inr,
    );
    expect(projectedCorpusForMode(projection, "real")).toBe(
      projection.projected_real_corpus_inr,
    );
    expect(projectedCorpusForMode(projection, "real")).toBeLessThan(
      projectedCorpusForMode(projection, "nominal"),
    );
  });

  it("deflates drawdown balances to today's value in real mode (§10.93)", () => {
    const nominal = 1_000_000;
    const real = drawdownBalanceForMode(nominal, "real", 20, 5, 6);
    expect(real).toBe(deflateToToday(nominal, 6, 25));
    expect(drawdownBalanceForMode(nominal, "nominal", 20, 5, 6)).toBe(nominal);
  });

  it("computes real funded ratio against today's expense target", () => {
    const projection = projectRetirementCorpus(makeReferenceRetirementInput());
    const target = realTargetCorpus(800_000, 4);
    const ratio = realFundedRatio(projection, 800_000, 4);
    expect(target).toBeGreaterThan(0);
    expect(ratio).toBeCloseTo(projection.projected_real_corpus_inr / target, 5);
  });

  it("maps yearly rows to the active corpus series", () => {
    const projection = projectRetirementCorpus(makeReferenceRetirementInput());
    const row = projection.yearly[0]!;
    expect(yearlyCorpusForMode(row, "nominal")).toBe(row.corpus_nominal_inr);
    expect(yearlyCorpusForMode(row, "real")).toBe(row.corpus_real_inr);
  });
});
