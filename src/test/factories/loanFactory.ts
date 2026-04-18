export interface ReferenceLoanInput {
  principal_inr: number;
  annual_interest_rate: number;
  tenure_months: number;
  monthly_salary_inr: number;
}

export function makeReferenceLoanInput(
  overrides: Partial<ReferenceLoanInput> = {},
): ReferenceLoanInput {
  return {
    principal_inr: 5_000_000,
    annual_interest_rate: 7.9,
    tenure_months: 168,
    monthly_salary_inr: 100_000,
    ...overrides,
  };
}

export function makeReferencePrepayInput(
  overrides: {
    prepay_month?: number;
    prepay_inr?: number;
    monthly_extra_inr?: number;
  } = {},
) {
  return {
    prepay_month: overrides.prepay_month ?? 1,
    prepay_inr: overrides.prepay_inr ?? 2_500_000,
    monthly_extra_inr: overrides.monthly_extra_inr ?? 0,
  };
}

export function makeReferencePfInput(
  overrides: {
    pf_corpus_inr?: number;
    pf_annual_interest_rate_pct?: number;
    monthly_pf_addition_inr?: number;
  } = {},
) {
  return {
    pf_corpus_inr: overrides.pf_corpus_inr ?? 2_500_000,
    pf_annual_interest_rate_pct: overrides.pf_annual_interest_rate_pct ?? 8.25,
    monthly_pf_addition_inr: overrides.monthly_pf_addition_inr ?? 0,
  };
}
