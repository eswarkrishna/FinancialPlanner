import { type RetirementInput } from "../../lib/retirement";

export function makeReferenceRetirementInput(
  overrides: Partial<RetirementInput> = {},
): RetirementInput {
  return {
    current_corpus_inr: 1_000_000,
    monthly_contribution_inr: 30_000,
    annual_return_pct: 10,
    inflation_pct: 6,
    years_to_retirement: 20,
    annual_expense_today_inr: 800_000,
    safe_withdrawal_rate_pct: 4,
    ...overrides,
  };
}
