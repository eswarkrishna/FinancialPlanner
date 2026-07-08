import { describe, expect, it } from "vitest";
import { inPfTrancheLabel, pfTrancheToLoanLabel } from "./loanModelHelpers";

describe("pfTrancheToLoanLabel", () => {
  it("preserves India unemployment tranche-2 interest hint", () => {
    expect(pfTrancheToLoanLabel("IN", 1, true)).toBe(inPfTrancheLabel(1));
    expect(pfTrancheToLoanLabel("IN", 1, true)).toContain("25%+interest");
  });

  it("uses employed label when job loss mode is off", () => {
    expect(pfTrancheToLoanLabel("IN", 1, false)).toBe(
      "PF tranches to loan (75% m1 + 25% m12)",
    );
  });
});
