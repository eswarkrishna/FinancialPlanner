import { describe, expect, it } from "vitest";
import { effectiveGoldLiquidInr } from "./gold";

describe("effectiveGoldLiquidInr (SPEC §4.2)", () => {
  it("returns full value when haircut disabled", () => {
    expect(effectiveGoldLiquidInr(2_500_000, false, 10)).toBe(2_500_000);
  });

  it("applies haircut percentage when enabled", () => {
    expect(effectiveGoldLiquidInr(2_500_000, true, 10)).toBe(2_250_000);
  });

  it("clamps haircut above 100%", () => {
    expect(effectiveGoldLiquidInr(1_000_000, true, 150)).toBe(0);
  });
});
