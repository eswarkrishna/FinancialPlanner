import { roundInr } from "../money";
import {
  SSY_MATURITY_AGE_YEARS,
  SSY_MAX_ANNUAL_CONTRIBUTION_INR,
  SSY_MAX_DEPOSIT_YEARS,
  SSY_MAX_GIRL_AGE_AT_OPENING,
  SSY_MIN_ANNUAL_CONTRIBUTION_INR,
} from "./constants";

export type SsyWarningCode =
  | "SSY_BELOW_MIN"
  | "SSY_ABOVE_MAX"
  | "SSY_AGE_ABOVE_MAX"
  | "SSY_INVALID_AGE";

export interface SsyInput {
  annual_contribution_inr: number;
  girl_age_years: number;
  interest_rate_pct: number;
}

export interface SsyYearRow {
  year: number;
  girl_age: number;
  opening_inr: number;
  contribution_inr: number;
  interest_inr: number;
  closing_inr: number;
}

export interface SsyProjection {
  maturity_value_inr: number;
  total_contributed_inr: number;
  total_interest_inr: number;
  years_to_maturity: number;
  deposit_years: number;
  yearly: SsyYearRow[];
  warnings: SsyWarningCode[];
}

export function yearsToSsyMaturity(girlAgeYears: number): number {
  return SSY_MATURITY_AGE_YEARS - Math.floor(girlAgeYears);
}

export function collectSsyWarnings(input: SsyInput): SsyWarningCode[] {
  const warnings: SsyWarningCode[] = [];
  const contribution = Math.max(0, input.annual_contribution_inr);
  const girlAge = Math.floor(input.girl_age_years);
  const yearsToMaturity = yearsToSsyMaturity(girlAge);

  if (girlAge < 0 || yearsToMaturity < 1) {
    warnings.push("SSY_INVALID_AGE");
  }
  if (girlAge > SSY_MAX_GIRL_AGE_AT_OPENING) {
    warnings.push("SSY_AGE_ABOVE_MAX");
  }
  if (contribution > 0 && contribution < SSY_MIN_ANNUAL_CONTRIBUTION_INR) {
    warnings.push("SSY_BELOW_MIN");
  }
  if (contribution > SSY_MAX_ANNUAL_CONTRIBUTION_INR) {
    warnings.push("SSY_ABOVE_MAX");
  }
  return warnings;
}

export function projectSsyMaturity(input: SsyInput): SsyProjection {
  const annualContribution = Math.max(0, input.annual_contribution_inr);
  const girlAgeAtOpening = Math.floor(input.girl_age_years);
  const ratePct = Math.max(0, input.interest_rate_pct);
  const warnings = collectSsyWarnings(input);

  const years_to_maturity = Math.max(0, yearsToSsyMaturity(girlAgeAtOpening));
  const deposit_years = Math.min(years_to_maturity, SSY_MAX_DEPOSIT_YEARS);

  const yearly: SsyYearRow[] = [];
  let balance = 0;

  for (let year = 1; year <= years_to_maturity; year += 1) {
    const opening_inr = balance;
    const contribution_inr = year <= deposit_years ? annualContribution : 0;
    const interest_inr = roundInr((opening_inr + contribution_inr) * (ratePct / 100));
    const closing_inr = roundInr(opening_inr + contribution_inr + interest_inr);
    yearly.push({
      year,
      girl_age: girlAgeAtOpening + year,
      opening_inr,
      contribution_inr,
      interest_inr,
      closing_inr,
    });
    balance = closing_inr;
  }

  const total_contributed_inr = roundInr(annualContribution * deposit_years);
  const maturity_value_inr = balance;
  const total_interest_inr = roundInr(maturity_value_inr - total_contributed_inr);

  return {
    maturity_value_inr,
    total_contributed_inr,
    total_interest_inr,
    years_to_maturity,
    deposit_years,
    yearly,
    warnings,
  };
}
