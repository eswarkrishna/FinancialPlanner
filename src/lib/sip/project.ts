import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";

export interface SipInput {
  monthly_investment_inr: number;
  annual_return_pct: number;
  duration_months: number;
}

export interface SipMonthRow {
  month: number;
  invested_inr: number;
  corpus_inr: number;
  gains_inr: number;
}

export interface SipProjection {
  total_invested_inr: number;
  maturity_value_inr: number;
  total_gains_inr: number;
  monthly: SipMonthRow[];
}

/** SIP future value — contributions at month-end (§4.17). */
export function projectSip(input: SipInput): SipProjection {
  const months = Math.max(0, Math.floor(input.duration_months));
  const monthly = Math.max(0, input.monthly_investment_inr);
  const r = nominalMonthlyRateFromAnnualPercent(Math.max(0, input.annual_return_pct));

  let corpus = 0;
  let invested = 0;
  const rows: SipMonthRow[] = [];

  for (let month = 1; month <= months; month += 1) {
    invested = roundInr(invested + monthly);
    corpus = roundInr(corpus * (1 + r) + monthly);
    rows.push({
      month,
      invested_inr: invested,
      corpus_inr: corpus,
      gains_inr: roundInr(corpus - invested),
    });
  }

  return {
    total_invested_inr: invested,
    maturity_value_inr: corpus,
    total_gains_inr: roundInr(corpus - invested),
    monthly: rows,
  };
}
