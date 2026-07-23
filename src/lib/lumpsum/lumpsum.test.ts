import { describe, expect, it } from "vitest";
import { projectLumpsumGrowth } from "./project";

describe("projectLumpsumGrowth (§4.21, §10.83)", () => {
  it("matches reference golden: ₹1L principal, 12%, 10 years", () => {
    const result = projectLumpsumGrowth({
      principal_inr: 100_000,
      expected_annual_return_pct: 12,
      years: 10,
    });

    expect(result.maturity_value_inr).toBe(310_584.83);
    expect(result.principal_inr).toBe(100_000);
    expect(result.total_gains_inr).toBe(210_584.83);
    expect(result.yearly).toHaveLength(10);
    expect(result.yearly[9]!.closing_inr).toBe(310_584.83);
  });

  it("warns when principal is zero (§10.84)", () => {
    const result = projectLumpsumGrowth({
      principal_inr: 0,
      expected_annual_return_pct: 12,
      years: 10,
    });
    expect(result.warnings).toContain("LUMPSUM_NO_PRINCIPAL");
  });

  it("warns when years are invalid (§10.84)", () => {
    const result = projectLumpsumGrowth({
      principal_inr: 100_000,
      expected_annual_return_pct: 12,
      years: 0,
    });
    expect(result.warnings).toContain("LUMPSUM_INVALID_YEARS");
  });
});
