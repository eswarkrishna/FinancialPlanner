import { describe, expect, it } from "vitest";
import { projectSsyMaturity } from "./project";

describe("projectSsyMaturity (§4.19, §10.70)", () => {
  it("matches reference golden: girl age 5, ₹1.5L/year, 8.2%", () => {
    const result = projectSsyMaturity({
      annual_contribution_inr: 150_000,
      girl_age_years: 5,
      interest_rate_pct: 8.2,
    });

    expect(result.years_to_maturity).toBe(16);
    expect(result.deposit_years).toBe(15);
    expect(result.maturity_value_inr).toBe(4_843_020.48);
    expect(result.total_contributed_inr).toBe(2_250_000);
    expect(result.total_interest_inr).toBe(2_593_020.48);
    expect(result.yearly).toHaveLength(16);
    expect(result.yearly[14]!.contribution_inr).toBe(150_000);
    expect(result.yearly[15]!.contribution_inr).toBe(0);
    expect(result.yearly[15]!.closing_inr).toBe(4_843_020.48);
  });

  it("warns when contribution exceeds annual limit (§10.71)", () => {
    const result = projectSsyMaturity({
      annual_contribution_inr: 200_000,
      girl_age_years: 5,
      interest_rate_pct: 8.2,
    });
    expect(result.warnings).toContain("SSY_ABOVE_MAX");
  });

  it("warns when contribution is below minimum (§10.71)", () => {
    const result = projectSsyMaturity({
      annual_contribution_inr: 200,
      girl_age_years: 5,
      interest_rate_pct: 8.2,
    });
    expect(result.warnings).toContain("SSY_BELOW_MIN");
  });

  it("warns when girl age exceeds opening limit (§10.71)", () => {
    const result = projectSsyMaturity({
      annual_contribution_inr: 150_000,
      girl_age_years: 11,
      interest_rate_pct: 8.2,
    });
    expect(result.warnings).toContain("SSY_AGE_ABOVE_MAX");
  });

  it("warns when girl age is negative (§10.71)", () => {
    const result = projectSsyMaturity({
      annual_contribution_inr: 150_000,
      girl_age_years: -1,
      interest_rate_pct: 8.2,
    });
    expect(result.warnings).toContain("SSY_INVALID_AGE");
  });

  it("stops deposits after 15 years but continues interest until age 21", () => {
    const result = projectSsyMaturity({
      annual_contribution_inr: 150_000,
      girl_age_years: 0,
      interest_rate_pct: 8.2,
    });
    expect(result.years_to_maturity).toBe(21);
    expect(result.deposit_years).toBe(15);
    expect(result.total_contributed_inr).toBe(2_250_000);
    expect(result.yearly.filter((row) => row.contribution_inr > 0)).toHaveLength(15);
  });
});
