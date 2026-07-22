/** Government-notified SSY rate for FY 2025–26 Q1 — verify against latest NSC/India Post notification (§4.19). */
export const DEFAULT_SSY_INTEREST_RATE_PCT = 8.2;

export const SSY_MIN_ANNUAL_CONTRIBUTION_INR = 250;
export const SSY_MAX_ANNUAL_CONTRIBUTION_INR = 150_000;
export const SSY_MAX_GIRL_AGE_AT_OPENING = 10;
export const SSY_MATURITY_AGE_YEARS = 21;
export const SSY_MAX_DEPOSIT_YEARS = 15;

export type SsyFormDefaults = {
  annual_contribution_inr: string;
  girl_age_years: string;
  interest_rate_pct: string;
};

export const REFERENCE_SSY_FORM: SsyFormDefaults = {
  annual_contribution_inr: "150000",
  girl_age_years: "5",
  interest_rate_pct: String(DEFAULT_SSY_INTEREST_RATE_PCT),
};
