/** Government-notified PPF rate for FY 2025–26 Q1 — verify against latest NSC/India Post notification (§4.17). */
export const DEFAULT_PPF_INTEREST_RATE_PCT = 7.1;

export const PPF_MIN_ANNUAL_CONTRIBUTION_INR = 500;
export const PPF_MAX_ANNUAL_CONTRIBUTION_INR = 150_000;
export const PPF_MIN_ACCOUNT_YEARS = 15;

export type PpfFormDefaults = {
  opening_balance_inr: string;
  annual_contribution_inr: string;
  interest_rate_pct: string;
  years: string;
};

export const REFERENCE_PPF_FORM: PpfFormDefaults = {
  opening_balance_inr: "0",
  annual_contribution_inr: "150000",
  interest_rate_pct: String(DEFAULT_PPF_INTEREST_RATE_PCT),
  years: "15",
};
