import { describe, expect, it } from "vitest";
import { computeEmi, monthlyRateFromAnnualPercent } from "./emi";

describe("computeEmi (docs/SPEC.md §10 reference)", () => {
  it("matches reference loan within ₹1", () => {
    const emi = computeEmi(5_000_000, 7.9, 168);
    expect(emi).toBeGreaterThanOrEqual(49_327);
    expect(emi).toBeLessThanOrEqual(49_329);
  });

  it("monthly rate helper", () => {
    expect(monthlyRateFromAnnualPercent(7.9)).toBeCloseTo(0.079 / 12, 12);
  });
});
