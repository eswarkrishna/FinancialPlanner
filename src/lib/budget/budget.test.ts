import { describe, expect, it } from "vitest";
import { analyzeBudget, projectInvestments, REFERENCE_BUDGET_IN } from "./index";

describe("analyzeBudget (§4.16)", () => {
  it("computes reference IN totals and savings rate", () => {
    const result = analyzeBudget(REFERENCE_BUDGET_IN);
    expect(result.summary.total_income_inr).toBe(175_000);
    expect(result.summary.total_expenses_inr).toBe(140_000);
    expect(result.summary.net_cash_flow_inr).toBe(35_000);
    expect(result.summary.savings_rate_pct).toBe(20);
  });

  it("computes 50/30/20 bucket percentages on reference fixture", () => {
    const { bucket_analysis } = analyzeBudget(REFERENCE_BUDGET_IN).summary;
    expect(bucket_analysis.needs_inr).toBe(95_000);
    expect(bucket_analysis.wants_inr).toBe(20_000);
    expect(bucket_analysis.savings_bucket_inr).toBe(25_000);
    expect(bucket_analysis.needs_pct).toBeCloseTo(54.3, 1);
    expect(bucket_analysis.wants_pct).toBeCloseTo(11.4, 1);
    expect(bucket_analysis.savings_bucket_pct).toBeCloseTo(14.3, 1);
  });

  it("flags deficit when expenses exceed income", () => {
    const result = analyzeBudget({
      ...REFERENCE_BUDGET_IN,
      expense_lines: [
        ...REFERENCE_BUDGET_IN.expense_lines,
        {
          id: "exp-extra",
          name: "Overspend",
          kind: "expense",
          amount_inr: 50_000,
          bucket: "want",
        },
      ],
    });
    expect(result.summary.net_cash_flow_inr).toBeLessThan(0);
    expect(result.summary.warnings).toContain("BUDGET_DEFICIT");
  });

  it("flags low emergency fund on reference fixture", () => {
    const result = analyzeBudget(REFERENCE_BUDGET_IN);
    expect(result.summary.emergency_fund_months).toBeCloseTo(1.1, 1);
    expect(result.summary.warnings).toContain("LOW_EMERGENCY_FUND");
    expect(result.summary.warnings).toContain("NEEDS_OVER_50");
  });

  it("builds asset class allocations", () => {
    const result = analyzeBudget(REFERENCE_BUDGET_IN);
    expect(result.allocations.length).toBeGreaterThan(0);
    const equity = result.allocations.find((row) => row.asset_class === "equity");
    expect(equity?.value_inr).toBe(800_000);
  });
});

describe("projectInvestments (§4.16)", () => {
  it("projects a single holding with contributions", () => {
    const projection = projectInvestments(
      [
        {
          id: "h1",
          name: "Equity",
          asset_class: "equity",
          current_value_inr: 100_000,
          monthly_contribution_inr: 10_000,
          expected_return_pct: 12,
        },
      ],
      12,
    );
    expect(projection.rows).toHaveLength(13);
    expect(projection.projected_total_inr).toBeGreaterThan(220_000);
    expect(projection.total_contributions_inr).toBe(120_000);
  });
});
