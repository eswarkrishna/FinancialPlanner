import { roundInr } from "../money";
import {
  PPF_MAX_ANNUAL_CONTRIBUTION_INR,
  PPF_MIN_ANNUAL_CONTRIBUTION_INR,
} from "./constants";

export type PpfWarningCode = "PPF_BELOW_MIN" | "PPF_ABOVE_MAX" | "PPF_INVALID_YEARS";

export interface PpfInput {
  opening_balance_inr: number;
  annual_contribution_inr: number;
  interest_rate_pct: number;
  years: number;
}

export interface PpfYearRow {
  year: number;
  opening_inr: number;
  contribution_inr: number;
  interest_inr: number;
  closing_inr: number;
}

export interface PpfProjection {
  maturity_value_inr: number;
  total_contributed_inr: number;
  total_interest_inr: number;
  yearly: PpfYearRow[];
  warnings: PpfWarningCode[];
}

export function collectPpfWarnings(input: PpfInput): PpfWarningCode[] {
  const warnings: PpfWarningCode[] = [];
  const contribution = Math.max(0, input.annual_contribution_inr);
  const years = Math.floor(input.years);

  if (years < 1) {
    warnings.push("PPF_INVALID_YEARS");
  }
  if (contribution > 0 && contribution < PPF_MIN_ANNUAL_CONTRIBUTION_INR) {
    warnings.push("PPF_BELOW_MIN");
  }
  if (contribution > PPF_MAX_ANNUAL_CONTRIBUTION_INR) {
    warnings.push("PPF_ABOVE_MAX");
  }
  return warnings;
}

export function projectPpfMaturity(input: PpfInput): PpfProjection {
  const openingBalance = roundInr(Math.max(0, input.opening_balance_inr));
  const annualContribution = Math.max(0, input.annual_contribution_inr);
  const ratePct = Math.max(0, input.interest_rate_pct);
  const years = Math.max(0, Math.floor(input.years));
  const warnings = collectPpfWarnings(input);

  const yearly: PpfYearRow[] = [];
  let balance = openingBalance;

  for (let year = 1; year <= years; year += 1) {
    const opening_inr = balance;
    const interest_inr = roundInr((opening_inr + annualContribution) * (ratePct / 100));
    const closing_inr = roundInr(opening_inr + annualContribution + interest_inr);
    yearly.push({
      year,
      opening_inr,
      contribution_inr: annualContribution,
      interest_inr,
      closing_inr,
    });
    balance = closing_inr;
  }

  const total_contributed_inr = roundInr(annualContribution * years);
  const maturity_value_inr = balance;
  const total_interest_inr = roundInr(
    maturity_value_inr - openingBalance - total_contributed_inr,
  );

  return {
    maturity_value_inr,
    total_contributed_inr,
    total_interest_inr,
    yearly,
    warnings,
  };
}
