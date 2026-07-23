import { roundInr } from "../money";

export type LumpsumWarningCode = "LUMPSUM_INVALID_YEARS" | "LUMPSUM_NO_PRINCIPAL";

export interface LumpsumInput {
  principal_inr: number;
  expected_annual_return_pct: number;
  years: number;
}

export interface LumpsumYearRow {
  year: number;
  opening_inr: number;
  interest_inr: number;
  closing_inr: number;
}

export interface LumpsumProjection {
  maturity_value_inr: number;
  principal_inr: number;
  total_gains_inr: number;
  yearly: LumpsumYearRow[];
  warnings: LumpsumWarningCode[];
}

export function collectLumpsumWarnings(input: LumpsumInput): LumpsumWarningCode[] {
  const warnings: LumpsumWarningCode[] = [];
  const years = Math.floor(input.years);
  const principal = Math.max(0, input.principal_inr);

  if (years < 1) {
    warnings.push("LUMPSUM_INVALID_YEARS");
  }
  if (principal === 0) {
    warnings.push("LUMPSUM_NO_PRINCIPAL");
  }
  return warnings;
}

export function projectLumpsumGrowth(input: LumpsumInput): LumpsumProjection {
  const principal_inr = roundInr(Math.max(0, input.principal_inr));
  const ratePct = Math.max(0, input.expected_annual_return_pct);
  const years = Math.max(0, Math.floor(input.years));
  const warnings = collectLumpsumWarnings(input);

  const yearly: LumpsumYearRow[] = [];
  let balance = principal_inr;

  for (let year = 1; year <= years; year += 1) {
    const opening_inr = balance;
    const interest_inr = roundInr(opening_inr * (ratePct / 100));
    const closing_inr = roundInr(opening_inr + interest_inr);
    yearly.push({ year, opening_inr, interest_inr, closing_inr });
    balance = closing_inr;
  }

  const maturity_value_inr = balance;
  const total_gains_inr = roundInr(maturity_value_inr - principal_inr);

  return {
    maturity_value_inr,
    principal_inr,
    total_gains_inr,
    yearly,
    warnings,
  };
}
