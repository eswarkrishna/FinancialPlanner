import { roundInr } from "../money";

export interface PpfInput {
  opening_balance_inr: number;
  annual_contribution_inr: number;
  annual_interest_rate_pct: number;
  duration_years: number;
}

export interface PpfYearRow {
  year: number;
  contribution_inr: number;
  interest_inr: number;
  closing_balance_inr: number;
}

export interface PpfProjection {
  total_contributed_inr: number;
  total_interest_inr: number;
  maturity_value_inr: number;
  yearly: PpfYearRow[];
}

/**
 * PPF projection — annual contribution then year-end interest (§4.18).
 * Educational model; verify current notified rate with official sources.
 */
export function projectPpf(input: PpfInput): PpfProjection {
  const years = Math.max(0, Math.floor(input.duration_years));
  const annualContribution = Math.max(0, input.annual_contribution_inr);
  const rate = Math.max(0, input.annual_interest_rate_pct) / 100;

  let balance = roundInr(Math.max(0, input.opening_balance_inr));
  let totalContributed = 0;
  let totalInterest = 0;
  const yearly: PpfYearRow[] = [];

  for (let year = 1; year <= years; year += 1) {
    balance = roundInr(balance + annualContribution);
    totalContributed = roundInr(totalContributed + annualContribution);
    const interest = roundInr(balance * rate);
    balance = roundInr(balance + interest);
    totalInterest = roundInr(totalInterest + interest);
    yearly.push({
      year,
      contribution_inr: annualContribution,
      interest_inr: interest,
      closing_balance_inr: balance,
    });
  }

  return {
    total_contributed_inr: roundInr(
      Math.max(0, input.opening_balance_inr) + totalContributed,
    ),
    total_interest_inr: totalInterest,
    maturity_value_inr: balance,
    yearly,
  };
}
