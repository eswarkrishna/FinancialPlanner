import { describe, expect, it } from "vitest";
import {
  computeK401LoanCapUsd,
  computeVestedFractionPct,
} from "./vesting";

describe("k401 vesting (SPEC-US v1.1)", () => {
  it("cliff_3 vests 0 before 3 years", () => {
    expect(computeVestedFractionPct("cliff_3", 2)).toBe(0);
    expect(computeVestedFractionPct("cliff_3", 3)).toBe(100);
  });

  it("graded_6 ramps to 100% at year 6", () => {
    expect(computeVestedFractionPct("graded_6", 3)).toBe(50);
    expect(computeVestedFractionPct("graded_6", 6)).toBe(100);
  });

  it("401(k) loan cap is min(50% vested, 50k)", () => {
    expect(computeK401LoanCapUsd(200_000)).toBe(50_000);
    expect(computeK401LoanCapUsd(60_000)).toBe(30_000);
  });
});
