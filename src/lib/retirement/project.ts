import { roundInr } from "../money";
import { nominalMonthlyRateFromAnnualPercent } from "../rates/nominalMonthly";
import { DEFAULT_SAFE_WITHDRAWAL_RATE_PCT } from "./constants";

export interface RetirementInput {
  current_corpus_inr: number;
  monthly_contribution_inr: number;
  annual_return_pct: number;
  inflation_pct: number;
  years_to_retirement: number;
  annual_expense_today_inr: number;
  safe_withdrawal_rate_pct: number;
  /** US/UK: Social Security or State Pension benefit amount in the stored field. */
  expected_social_security_monthly_inr?: number;
  /** UK: stored benefit is weekly (×52 for annual); US/IN: monthly (×12). */
  social_security_is_weekly?: boolean;
}

export interface RetirementYearRow {
  year: number;
  corpus_nominal_inr: number;
  corpus_real_inr: number;
}

export interface RetirementProjection {
  projected_corpus_inr: number;
  projected_real_corpus_inr: number;
  annual_expense_at_retirement_inr: number;
  target_corpus_inr: number;
  funded_ratio: number;
  /** SPEC-US §4.11 v1.1 — expense gap after Social Security, divided by SWR. */
  ss_adjusted_target_corpus_inr?: number;
  ss_adjusted_funded_ratio?: number;
  yearly: RetirementYearRow[];
}

export interface RetirementScenarioResult {
  id: string;
  label: string;
  assumptions: {
    annual_return_pct: number;
    inflation_pct: number;
    monthly_contribution_inr: number;
  };
  projection: RetirementProjection;
}

function inflationFactor(annualInflationPct: number, years: number): number {
  return (1 + annualInflationPct / 100) ** years;
}

export function projectRetirementCorpus(input: RetirementInput): RetirementProjection {
  const months = Math.max(0, Math.floor(input.years_to_retirement * 12));
  const monthlyReturnRate = nominalMonthlyRateFromAnnualPercent(
    Math.max(0, input.annual_return_pct),
  );
  const annualInflationRate = Math.max(0, input.inflation_pct);
  const monthlyContribution = Math.max(0, input.monthly_contribution_inr);
  const swrPct =
    input.safe_withdrawal_rate_pct > 0
      ? input.safe_withdrawal_rate_pct
      : DEFAULT_SAFE_WITHDRAWAL_RATE_PCT;
  const swr = swrPct / 100;

  let corpus = roundInr(Math.max(0, input.current_corpus_inr));
  const yearly: RetirementYearRow[] = [];

  for (let month = 1; month <= months; month += 1) {
    const growth = roundInr(corpus * monthlyReturnRate);
    corpus = roundInr(corpus + growth + monthlyContribution);
    if (month % 12 === 0) {
      const year = month / 12;
      const factor = inflationFactor(annualInflationRate, year);
      yearly.push({
        year,
        corpus_nominal_inr: corpus,
        corpus_real_inr: roundInr(corpus / factor),
      });
    }
  }

  const inflation = inflationFactor(annualInflationRate, months / 12);
  const expenseAtRetirement = roundInr(
    Math.max(0, input.annual_expense_today_inr) * inflation,
  );
  const targetCorpus = roundInr(expenseAtRetirement / swr);
  const realCorpus = roundInr(corpus / inflation);
  const fundedRatio = targetCorpus <= 0 ? 0 : corpus / targetCorpus;

  const ssPeriods = input.social_security_is_weekly ? 52 : 12;
  const annualSsIncome = Math.max(
    0,
    (input.expected_social_security_monthly_inr ?? 0) * ssPeriods,
  );
  let ssAdjustedTarget: number | undefined;
  let ssAdjustedFundedRatio: number | undefined;
  if (annualSsIncome > 0 && swr > 0) {
    const expenseGap = Math.max(0, expenseAtRetirement - annualSsIncome);
    ssAdjustedTarget = roundInr(expenseGap / swr);
    ssAdjustedFundedRatio =
      ssAdjustedTarget <= 0 ? 1 : corpus / ssAdjustedTarget;
  }

  return {
    projected_corpus_inr: corpus,
    projected_real_corpus_inr: realCorpus,
    annual_expense_at_retirement_inr: expenseAtRetirement,
    target_corpus_inr: targetCorpus,
    funded_ratio: fundedRatio,
    ss_adjusted_target_corpus_inr: ssAdjustedTarget,
    ss_adjusted_funded_ratio: ssAdjustedFundedRatio,
    yearly,
  };
}

export function buildRetirementScenarios(
  base: RetirementInput,
): RetirementScenarioResult[] {
  const conservativeInput: RetirementInput = {
    ...base,
    annual_return_pct: Math.max(0, base.annual_return_pct - 2),
    inflation_pct: Math.max(0, base.inflation_pct + 1),
  };

  const optimisticInput: RetirementInput = {
    ...base,
    annual_return_pct: base.annual_return_pct + 2,
    inflation_pct: Math.max(0, base.inflation_pct - 1),
    monthly_contribution_inr: roundInr(base.monthly_contribution_inr * 1.2),
  };

  return [
    {
      id: "base",
      label: "Base",
      assumptions: {
        annual_return_pct: base.annual_return_pct,
        inflation_pct: base.inflation_pct,
        monthly_contribution_inr: base.monthly_contribution_inr,
      },
      projection: projectRetirementCorpus(base),
    },
    {
      id: "conservative",
      label: "Conservative",
      assumptions: {
        annual_return_pct: conservativeInput.annual_return_pct,
        inflation_pct: conservativeInput.inflation_pct,
        monthly_contribution_inr: conservativeInput.monthly_contribution_inr,
      },
      projection: projectRetirementCorpus(conservativeInput),
    },
    {
      id: "optimistic",
      label: "Optimistic",
      assumptions: {
        annual_return_pct: optimisticInput.annual_return_pct,
        inflation_pct: optimisticInput.inflation_pct,
        monthly_contribution_inr: optimisticInput.monthly_contribution_inr,
      },
      projection: projectRetirementCorpus(optimisticInput),
    },
  ];
}
