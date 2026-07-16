import { describe, expect, it } from "vitest";
import { parseStrategyImportJson } from "./strategyImport";

const validPayload = {
  locale: "IN",
  inputs: {
    principal_inr: 5_000_000,
    annual_interest_rate: 8.5,
    tenure_months: 240,
    cash_inr: 200_000,
    pf_corpus_inr: 800_000,
    pf_annual_interest_rate_pct: 8.25,
    monthly_pf_addition_inr: 12_000,
    monthly_take_home_inr: 150_000,
    monthly_living_expense_inr: 60_000,
    extra_monthly_income_inr: 0,
    emergency_months_buffer: 6,
    expected_equity_return_pct: 12,
    horizon_months: 120,
    repayment_pct_of_take_home: 20,
    extra_income_post_tax: false,
    marginal_tax_rate_pct: 30,
  },
};

describe("parseStrategyImportJson", () => {
  it("parses a valid strategy export", () => {
    const outcome = parseStrategyImportJson(JSON.stringify(validPayload), "IN");
    expect(outcome.success).toBe(true);
    if (outcome.success) {
      expect(outcome.form.principal_inr).toBe("5000000");
      expect(outcome.form.horizon_months).toBe("120");
    }
  });

  it("rejects invalid numeric inputs", () => {
    const outcome = parseStrategyImportJson(
      JSON.stringify({
        inputs: { ...validPayload.inputs, principal_inr: -1 },
      }),
      "IN",
    );
    expect(outcome.success).toBe(false);
  });

  it("rejects locale mismatch", () => {
    const outcome = parseStrategyImportJson(JSON.stringify(validPayload), "US");
    expect(outcome.success).toBe(false);
  });
});
