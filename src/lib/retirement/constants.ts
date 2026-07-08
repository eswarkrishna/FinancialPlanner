/** Spec §4.11 / SPEC-US §4.11 — classic Trinity-study default when user leaves SWR blank. */
export const DEFAULT_SAFE_WITHDRAWAL_RATE_PCT = 4;

export type RetirementFormDefaults = {
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
  expected_social_security_monthly_inr: string;
};

export const REFERENCE_RETIREMENT_FORM_IN: RetirementFormDefaults = {
  current_corpus_inr: "1000000",
  monthly_contribution_inr: "30000",
  annual_return_pct: "10",
  inflation_pct: "6",
  years_to_retirement: "20",
  annual_expense_today_inr: "800000",
  safe_withdrawal_rate_pct: String(DEFAULT_SAFE_WITHDRAWAL_RATE_PCT),
  expected_social_security_monthly_inr: "",
};

export const REFERENCE_RETIREMENT_FORM_US: RetirementFormDefaults = {
  current_corpus_inr: "100000",
  monthly_contribution_inr: "500",
  annual_return_pct: "7",
  inflation_pct: "3",
  years_to_retirement: "25",
  annual_expense_today_inr: "60000",
  safe_withdrawal_rate_pct: String(DEFAULT_SAFE_WITHDRAWAL_RATE_PCT),
  expected_social_security_monthly_inr: "2000",
};

export const REFERENCE_RETIREMENT_FORM_UK: RetirementFormDefaults = {
  current_corpus_inr: "60000",
  monthly_contribution_inr: "294",
  annual_return_pct: "5",
  inflation_pct: "3",
  years_to_retirement: "25",
  annual_expense_today_inr: "36000",
  safe_withdrawal_rate_pct: String(DEFAULT_SAFE_WITHDRAWAL_RATE_PCT),
  expected_social_security_monthly_inr: "241.30",
};
