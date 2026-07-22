import { describe, expect, it } from "vitest";
import { projectGratuityPayout } from "./project";

describe("projectGratuityPayout (§4.20, §10.75)", () => {
  it("matches reference golden: ₹50k salary, 10 years", () => {
    const result = projectGratuityPayout({
      last_drawn_salary_inr: 50_000,
      years_of_service: 10,
    });

    expect(result.raw_gratuity_inr).toBe(288_461.54);
    expect(result.gratuity_payable_inr).toBe(288_461.54);
    expect(result.is_capped).toBe(false);
    expect(result.warnings).not.toContain("GRATUITY_CAPPED");
  });

  it("applies statutory cap (§10.76)", () => {
    const result = projectGratuityPayout({
      last_drawn_salary_inr: 150_000,
      years_of_service: 25,
    });

    expect(result.raw_gratuity_inr).toBeGreaterThan(2_000_000);
    expect(result.gratuity_payable_inr).toBe(2_000_000);
    expect(result.is_capped).toBe(true);
    expect(result.warnings).toContain("GRATUITY_CAPPED");
  });

  it("warns when service is below five years (§10.76)", () => {
    const result = projectGratuityPayout({
      last_drawn_salary_inr: 50_000,
      years_of_service: 4,
    });
    expect(result.warnings).toContain("GRATUITY_BELOW_MIN_YEARS");
  });
});
