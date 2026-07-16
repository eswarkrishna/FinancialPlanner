import { describe, expect, it } from "vitest";
import {
  buildCumulativeInterestCurve,
  buildDebtBalanceCurve,
  buildPrincipalCurve,
  buildRetirementCorpusCurve,
  buildRetirementRealCorpusCurve,
} from "./chartData";

describe("chartData", () => {
  it("builds principal curve from schedule rows", () => {
    const rows = [
      { month: 1, closing_inr: 4_900_000, interest_inr: 32_000, principal_inr: 100_000 },
      { month: 2, closing_inr: 4_800_000, interest_inr: 31_000, principal_inr: 100_000 },
    ];
    const points = buildPrincipalCurve(rows as never);
    expect(points).toEqual([
      { month: 1, value_inr: 4_900_000 },
      { month: 2, value_inr: 4_800_000 },
    ]);
  });

  it("builds cumulative interest curve", () => {
    const rows = [
      { month: 1, closing_inr: 0, interest_inr: 10_000, principal_inr: 0 },
      { month: 2, closing_inr: 0, interest_inr: 9_000, principal_inr: 0 },
    ];
    const points = buildCumulativeInterestCurve(rows as never);
    expect(points[1]!.value_inr).toBe(19_000);
  });

  it("builds debt balance curve", () => {
    const points = buildDebtBalanceCurve([
      { month: 1, closing_total_inr: 200_000 },
      { month: 2, closing_total_inr: 150_000 },
    ] as never);
    expect(points[1]!.value_inr).toBe(150_000);
  });

  it("builds retirement nominal and real curves", () => {
    const yearly = [
      { year: 1, corpus_nominal_inr: 1_100_000, corpus_real_inr: 1_000_000 },
      { year: 2, corpus_nominal_inr: 1_250_000, corpus_real_inr: 1_050_000 },
    ];
    expect(buildRetirementCorpusCurve(yearly)[1]!.value_inr).toBe(1_250_000);
    expect(buildRetirementRealCorpusCurve(yearly)[1]!.value_inr).toBe(1_050_000);
  });
});
