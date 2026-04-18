import { describe, expect, it } from "vitest";
import { computeEmi, monthlyRateFromAnnualPercent } from "./loan/emi";

describe("computeEmi (docs/SPEC.md §10 reference)", () => {
  it("matches reference loan (analytic check, rounded paise)", () => {
    const emi = computeEmi(5_000_000, 7.9, 168);
    expect(emi).toBeCloseTo(49_282.45, 1);
  });

  it("monthly rate helper", () => {
    expect(monthlyRateFromAnnualPercent(7.9)).toBeCloseTo(0.079 / 12, 12);
  });
});
