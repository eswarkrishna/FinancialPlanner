/** Illustrative long-term equity CAGR for education — not a forecast (§4.21). */
export const DEFAULT_LUMPSUM_RETURN_PCT = 12;

export type LumpsumFormDefaults = {
  principal_inr: string;
  expected_annual_return_pct: string;
  years: string;
};

export const REFERENCE_LUMPSUM_FORM: LumpsumFormDefaults = {
  principal_inr: "100000",
  expected_annual_return_pct: String(DEFAULT_LUMPSUM_RETURN_PCT),
  years: "10",
};
