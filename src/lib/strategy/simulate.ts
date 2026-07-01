import { roundInr } from "../money";
import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
} from "../loan/amortisation";
import { computeEmi } from "../loan/emi";
import {
  EQUITY_BLEND_EXTRA_TO_PRINCIPAL_FRACTION,
  EQUITY_BLEND_PREPAY_FRACTION,
  FRAGILE_CASH_FLOW_RATIO,
  LTCG_EXEMPTION_INR,
  LTCG_RATE_PCT,
  SUBSISTENCE_FLOOR_INR,
} from "./constants";
import {
  projectEquityCorpusMonths,
  projectPfCorpusMonths,
} from "./projection";
import type {
  StrategyId,
  StrategyInputs,
  StrategyResult,
  StrategyWarning,
} from "./types";

interface StrategyAllocation {
  oneTimePrepayInr: number;
  monthlyExtraPrincipalInr: number;
  monthlySipInr: number;
  equityLumpInr: number;
  postLoanRedirectInr: number;
}

function postTaxExtra(input: StrategyInputs): number {
  const raw = Math.max(0, input.extra_monthly_income_inr);
  if (input.extra_income_post_tax) return raw;
  const factor = Math.max(0, 1 - Math.max(0, input.marginal_tax_rate_pct) / 100);
  return roundInr(raw * factor);
}

function clampPct(pct: number | undefined): { clamped: number; invalid: boolean } {
  if (pct === undefined || Number.isNaN(pct)) return { clamped: 0, invalid: false };
  if (pct < 0) return { clamped: 0, invalid: true };
  if (pct > 100) return { clamped: 100, invalid: true };
  return { clamped: pct, invalid: false };
}

function allocate(
  strategyId: StrategyId,
  input: StrategyInputs,
  emi0: number,
  deployable: number,
  extra: number,
): { allocation: StrategyAllocation; pctInvalid: boolean } {
  if (strategyId === "STRATEGY_EQUITY_BLEND") {
    const oneTime = roundInr(deployable * EQUITY_BLEND_PREPAY_FRACTION);
    const lump = roundInr(deployable - oneTime);
    const monthlyExtra = roundInr(extra * EQUITY_BLEND_EXTRA_TO_PRINCIPAL_FRACTION);
    const sip = roundInr(extra - monthlyExtra);
    return {
      allocation: {
        oneTimePrepayInr: oneTime,
        monthlyExtraPrincipalInr: monthlyExtra,
        monthlySipInr: sip,
        equityLumpInr: lump,
        postLoanRedirectInr: roundInr(emi0 + extra),
      },
      pctInvalid: false,
    };
  }
  if (strategyId === "STRATEGY_PREPAY_HEAVY") {
    return {
      allocation: {
        oneTimePrepayInr: deployable,
        monthlyExtraPrincipalInr: extra,
        monthlySipInr: 0,
        equityLumpInr: 0,
        postLoanRedirectInr: roundInr(emi0 + extra),
      },
      pctInvalid: false,
    };
  }
  const { clamped, invalid } = clampPct(input.repayment_pct_of_take_home);
  const committedFromTakeHome = roundInr((clamped / 100) * input.monthly_take_home_inr);
  const committedToLoan = roundInr(committedFromTakeHome + extra);
  const monthlyExtra = Math.max(0, roundInr(committedToLoan - emi0));
  return {
    allocation: {
      oneTimePrepayInr: deployable,
      monthlyExtraPrincipalInr: monthlyExtra,
      monthlySipInr: 0,
      equityLumpInr: 0,
      postLoanRedirectInr: committedToLoan,
    },
    pctInvalid: invalid,
  };
}

/**
 * Spec §4.12.3 — simulate one named strategy end to end.
 * Reuses §4.5 fixed-EMI engine for the loan side and §4.12 projection helpers
 * for the equity sleeve and PF horizon corpus.
 */
export function simulateStrategy(
  strategyId: StrategyId,
  input: StrategyInputs,
): StrategyResult {
  const warnings: StrategyWarning[] = [];
  const emi0 = computeEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );

  const baseline = baselineSchedule(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );

  const buffer = roundInr(
    Math.max(0, input.emergency_months_buffer) *
      (Math.max(0, input.monthly_living_expense_inr) + emi0),
  );
  const cashShortfall = input.cash_inr < buffer;
  if (cashShortfall) warnings.push("EMERGENCY_FUND_SHORTFALL");
  const deployable = cashShortfall
    ? 0
    : roundInr(Math.max(0, input.cash_inr - buffer));
  const cashBufferRemaining = cashShortfall
    ? roundInr(Math.max(0, input.cash_inr))
    : roundInr(input.cash_inr - deployable);

  if (
    input.monthly_take_home_inr > 0 &&
    emi0 > FRAGILE_CASH_FLOW_RATIO * input.monthly_take_home_inr
  ) {
    warnings.push("FRAGILE_CASH_FLOW");
  }

  const extra = postTaxExtra(input);
  const { allocation, pctInvalid } = allocate(
    strategyId,
    input,
    emi0,
    deployable,
    extra,
  );
  if (pctInvalid) warnings.push("AGGRESSIVE_PCT_INVALID");

  const loanRun = scheduleFixedEmiWithMonthlyExtra(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
    allocation.monthlyExtraPrincipalInr,
    allocation.oneTimePrepayInr > 0
      ? { month: 1, amount: allocation.oneTimePrepayInr }
      : undefined,
  );

  const loanCloseMonth = loanRun.totals.payoff_month;
  const horizon = Math.max(0, Math.floor(input.horizon_months));
  if (horizon < loanCloseMonth) warnings.push("HORIZON_TOO_SHORT");

  const monthsInLoanPhase = Math.min(loanCloseMonth, horizon);
  const monthsPostLoan = Math.max(0, horizon - loanCloseMonth);

  let equityCorpus = projectEquityCorpusMonths(
    allocation.equityLumpInr,
    allocation.monthlySipInr,
    input.expected_equity_return_pct,
    monthsInLoanPhase,
  );
  let totalInvested = roundInr(
    allocation.equityLumpInr + allocation.monthlySipInr * monthsInLoanPhase,
  );
  if (monthsPostLoan > 0) {
    const before = equityCorpus;
    equityCorpus = projectEquityCorpusMonths(
      before,
      allocation.postLoanRedirectInr,
      input.expected_equity_return_pct,
      monthsPostLoan,
    );
    totalInvested = roundInr(
      totalInvested + allocation.postLoanRedirectInr * monthsPostLoan,
    );
  }

  const equityGain = Math.max(0, roundInr(equityCorpus - totalInvested));
  const taxableGain = Math.max(0, equityGain - LTCG_EXEMPTION_INR);
  const ltcgTax = roundInr((taxableGain * LTCG_RATE_PCT) / 100);
  const equityCorpusPostTax = roundInr(equityCorpus - ltcgTax);

  const pfCorpusAtHorizon = projectPfCorpusMonths(
    input.pf_corpus_inr,
    input.monthly_pf_addition_inr,
    input.pf_annual_interest_rate_pct,
    horizon,
  );

  const loanBalanceAtHorizon =
    horizon >= loanCloseMonth
      ? 0
      : roundInr(Math.max(0, loanRun.rows[horizon - 1]?.closing_inr ?? 0));

  const netWorthAtHorizon = roundInr(
    equityCorpus + cashBufferRemaining + pfCorpusAtHorizon - loanBalanceAtHorizon,
  );

  const minLivingBudget = roundInr(
    input.monthly_take_home_inr +
      extra -
      (emi0 +
        allocation.monthlyExtraPrincipalInr +
        allocation.monthlySipInr),
  );
  if (minLivingBudget < (input.subsistence_floor_inr ?? SUBSISTENCE_FLOOR_INR)) {
    warnings.push("BELOW_SUBSISTENCE");
  }

  const interestSaved = roundInr(
    baseline.totals.total_interest_inr - loanRun.totals.total_interest_inr,
  );

  return {
    strategy_id: strategyId,
    loan_close_month: loanCloseMonth,
    total_interest_inr: loanRun.totals.total_interest_inr,
    interest_saved_vs_base_inr: interestSaved,
    one_time_prepay_inr: allocation.oneTimePrepayInr,
    monthly_extra_principal_inr: allocation.monthlyExtraPrincipalInr,
    monthly_sip_inr: allocation.monthlySipInr,
    equity_lump_inr: allocation.equityLumpInr,
    equity_corpus_at_horizon_inr: equityCorpus,
    equity_corpus_at_horizon_post_tax_inr: equityCorpusPostTax,
    pf_corpus_at_horizon_inr: pfCorpusAtHorizon,
    cash_buffer_remaining_inr: cashBufferRemaining,
    loan_balance_at_horizon_inr: loanBalanceAtHorizon,
    net_worth_at_horizon_inr: netWorthAtHorizon,
    min_living_budget_inr: minLivingBudget,
    warnings,
  };
}

/** Run all three named strategies in spec order for the comparison table (§4.12.5). */
export function simulateAllStrategies(input: StrategyInputs): StrategyResult[] {
  const ids: StrategyId[] = [
    "STRATEGY_EQUITY_BLEND",
    "STRATEGY_PREPAY_HEAVY",
    "STRATEGY_AGGRESSIVE_PREPAY",
  ];
  return ids.map((id) => simulateStrategy(id, input));
}
