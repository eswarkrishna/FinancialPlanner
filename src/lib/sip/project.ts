import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";

export type SipWarningCode = "SIP_INVALID_YEARS" | "SIP_NO_CONTRIBUTION";

export interface SipInput {
  opening_balance_inr: number;
  monthly_investment_inr: number;
  expected_annual_return_pct: number;
  years: number;
}

export interface SipYearRow {
  year: number;
  opening_inr: number;
  contribution_inr: number;
  gains_inr: number;
  closing_inr: number;
}

export interface SipProjection {
  maturity_value_inr: number;
  total_invested_inr: number;
  total_gains_inr: number;
  yearly: SipYearRow[];
  warnings: SipWarningCode[];
}

export function collectSipWarnings(input: SipInput): SipWarningCode[] {
  const warnings: SipWarningCode[] = [];
  const years = Math.floor(input.years);
  const monthly = Math.max(0, input.monthly_investment_inr);
  const opening = Math.max(0, input.opening_balance_inr);

  if (years < 1) {
    warnings.push("SIP_INVALID_YEARS");
  }
  if (monthly === 0 && opening === 0) {
    warnings.push("SIP_NO_CONTRIBUTION");
  }
  return warnings;
}

export function projectSipMaturity(input: SipInput): SipProjection {
  const openingBalance = roundInr(Math.max(0, input.opening_balance_inr));
  const monthlyInvestment = Math.max(0, input.monthly_investment_inr);
  const monthlyRate = nominalMonthlyRateFromAnnualPercent(
    Math.max(0, input.expected_annual_return_pct),
  );
  const years = Math.max(0, Math.floor(input.years));
  const months = years * 12;
  const warnings = collectSipWarnings(input);

  const yearly: SipYearRow[] = [];
  let balance = openingBalance;
  let yearOpening = openingBalance;

  for (let month = 1; month <= months; month += 1) {
    const growth = roundInr(balance * monthlyRate);
    balance = roundInr(balance + growth + monthlyInvestment);

    if (month % 12 === 0) {
      const year = month / 12;
      const contribution_inr = roundInr(monthlyInvestment * 12);
      const closing_inr = balance;
      const gains_inr = roundInr(closing_inr - yearOpening - contribution_inr);
      yearly.push({
        year,
        opening_inr: yearOpening,
        contribution_inr,
        gains_inr,
        closing_inr,
      });
      yearOpening = closing_inr;
    }
  }

  const total_invested_inr = roundInr(monthlyInvestment * months);
  const maturity_value_inr = balance;
  const total_gains_inr = roundInr(
    maturity_value_inr - openingBalance - total_invested_inr,
  );

  return {
    maturity_value_inr,
    total_invested_inr,
    total_gains_inr,
    yearly,
    warnings,
  };
}
