/** Illustrative equity CAGR for SIP demos — not a return forecast (§4.18). */
export const DEFAULT_SIP_EXPECTED_RETURN_PCT = 12;

export type SipFormDefaults = {
  opening_balance_inr: string;
  monthly_investment_inr: string;
  expected_annual_return_pct: string;
  years: string;
};

export const REFERENCE_SIP_FORM: SipFormDefaults = {
  opening_balance_inr: "0",
  monthly_investment_inr: "10000",
  expected_annual_return_pct: String(DEFAULT_SIP_EXPECTED_RETURN_PCT),
  years: "10",
};
