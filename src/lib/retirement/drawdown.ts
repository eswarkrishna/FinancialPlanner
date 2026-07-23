import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";

/** Maximum post-retirement horizon when corpus does not deplete (§4.11.2). */
export const DEFAULT_MAX_DRAWDOWN_YEARS = 50;

export type RetirementDrawdownWarningCode =
  | "DRAWDOWN_NO_CORPUS"
  | "DRAWDOWN_NO_WITHDRAWAL";

export interface RetirementDrawdownInput {
  corpus_at_retirement_inr: number;
  monthly_withdrawal_inr: number;
  post_retirement_return_pct: number;
  max_years?: number;
}

export interface RetirementDrawdownYearRow {
  year: number;
  opening_inr: number;
  growth_inr: number;
  withdrawals_inr: number;
  closing_inr: number;
}

export interface RetirementDrawdownProjection {
  /** Post-retirement year when corpus reaches zero; null if it lasts through max_years. */
  depletion_year: number | null;
  lasts_indefinitely: boolean;
  max_years: number;
  yearly: RetirementDrawdownYearRow[];
  warnings: RetirementDrawdownWarningCode[];
}

export function collectDrawdownWarnings(
  input: RetirementDrawdownInput,
): RetirementDrawdownWarningCode[] {
  const warnings: RetirementDrawdownWarningCode[] = [];
  if (input.corpus_at_retirement_inr <= 0) {
    warnings.push("DRAWDOWN_NO_CORPUS");
  }
  if (input.monthly_withdrawal_inr <= 0) {
    warnings.push("DRAWDOWN_NO_WITHDRAWAL");
  }
  return warnings;
}

/** Monthly drawdown after retirement: growth then withdrawal each month (§4.11.2). */
export function projectRetirementDrawdown(
  input: RetirementDrawdownInput,
): RetirementDrawdownProjection {
  const maxYears = Math.max(1, Math.floor(input.max_years ?? DEFAULT_MAX_DRAWDOWN_YEARS));
  const maxMonths = maxYears * 12;
  const monthlyRate = nominalMonthlyRateFromAnnualPercent(
    Math.max(0, input.post_retirement_return_pct),
  );
  const monthlyWithdrawal = Math.max(0, input.monthly_withdrawal_inr);
  const warnings = collectDrawdownWarnings(input);

  let corpus = roundInr(Math.max(0, input.corpus_at_retirement_inr));
  const yearly: RetirementDrawdownYearRow[] = [];
  let depletionYear: number | null = null;
  let yearOpening = corpus;
  let yearGrowth = 0;
  let yearWithdrawals = 0;

  for (let month = 1; month <= maxMonths; month += 1) {
    if ((month - 1) % 12 === 0) {
      yearOpening = corpus;
      yearGrowth = 0;
      yearWithdrawals = 0;
    }

    const growth = roundInr(corpus * monthlyRate);
    yearGrowth = roundInr(yearGrowth + growth);
    yearWithdrawals = roundInr(yearWithdrawals + monthlyWithdrawal);
    corpus = roundInr(corpus + growth - monthlyWithdrawal);

    if (corpus <= 0 && depletionYear === null) {
      depletionYear = Math.ceil(month / 12);
    }
    if (corpus < 0) {
      corpus = 0;
    }

    if (month % 12 === 0) {
      yearly.push({
        year: month / 12,
        opening_inr: yearOpening,
        growth_inr: yearGrowth,
        withdrawals_inr: yearWithdrawals,
        closing_inr: corpus,
      });
    }
  }

  return {
    depletion_year: depletionYear,
    lasts_indefinitely: depletionYear === null,
    max_years: maxYears,
    yearly,
    warnings,
  };
}
