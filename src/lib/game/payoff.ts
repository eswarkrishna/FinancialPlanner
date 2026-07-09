import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
  type ScheduleTotals,
} from "../loan/amortisation";
import {
  simulateCashflowSchedule,
  simulateUeDelayPrepayCashflow,
  simulateUePfBridgeCashflow,
  simulateUePfToLoanCashflow,
  type CashflowSimInput,
} from "../loan/cashflow";
import { computeEmi } from "../loan/emi";
import { roundInr } from "../money";
import { simulateStrategy } from "../strategy/simulate";
import type { StrategyId } from "../strategy/types";
import {
  DEFAULT_PREPAYMENT_FEE_PCT,
  EXTRA_HIGH_INR,
  EXTRA_LOW_INR,
  REFERENCE_PREPAY_25_INR,
} from "./constants";
import type { GameInput } from "./gameInput";
import type {
  BLumpAction,
  BPolicyAction,
  BExtraAction,
  HSplitAction,
  LFeeAction,
  NEmploymentAction,
  NPfRouteAction,
  PayoffMetric,
  LenderObjective,
} from "./types";

/** Deployable cash after emergency buffer (§4.12.1 / §4.13.3). */
export function deployableCashInr(
  input: Pick<
    GameInput,
    | "cash_inr"
    | "emergency_months_buffer"
    | "monthly_living_expense_inr"
    | "principal_inr"
    | "annual_interest_rate"
    | "tenure_months"
  >,
): number {
  const emi0 = computeEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  );
  const buffer = roundInr(
    Math.max(0, input.emergency_months_buffer) *
      (Math.max(0, input.monthly_living_expense_inr) + emi0),
  );
  if (input.cash_inr < buffer) return 0;
  return roundInr(Math.max(0, input.cash_inr - buffer));
}

export function resolveLumpInr(lump: BLumpAction, input: GameInput): number {
  const deployable = deployableCashInr(input);
  switch (lump) {
    case "B_PREPAY_0":
      return 0;
    case "B_PREPAY_25":
      return Math.min(REFERENCE_PREPAY_25_INR, deployable);
    case "B_PREPAY_50":
      return roundInr(deployable * 0.5);
    case "B_PREPAY_100":
      return roundInr(deployable);
    default:
      return 0;
  }
}

export function resolveExtraInr(extra: BExtraAction): number {
  if (extra === "B_EXTRA_LOW") return EXTRA_LOW_INR;
  if (extra === "B_EXTRA_HIGH") return EXTRA_HIGH_INR;
  return 0;
}

export function prepaymentFeeInr(
  fee: LFeeAction,
  lumpInr: number,
  input: Pick<GameInput, "prepayment_fee_inr" | "prepayment_fee_pct">,
): number {
  if (lumpInr <= 0) return 0;
  if (fee === "L_FEE_0") return 0;
  if (fee === "L_FEE_FLAT") return roundInr(input.prepayment_fee_inr);
  const pct = input.prepayment_fee_pct ?? DEFAULT_PREPAYMENT_FEE_PCT;
  return roundInr((pct / 100) * lumpInr);
}

function cashflowInputFromGame(
  input: GameInput,
  unemploymentStartMonth: number,
  extraInr: number,
  lumpInr: number,
): Omit<
  CashflowSimInput,
  | "unemployment_enabled"
  | "pf_tranche1_destination"
  | "pf_tranche2_destination"
  | "pf_tranche1_loan_fraction"
  | "pf_tranche2_loan_fraction"
> {
  return {
    principal_inr: input.principal_inr,
    annual_interest_rate: input.annual_interest_rate,
    tenure_months: input.tenure_months,
    cash_inr: input.cash_inr,
    monthly_income_inr:
      input.monthly_take_home_inr ?? input.monthly_income_inr ?? 0,
    monthly_living_expense_inr: input.monthly_living_expense_inr,
    monthly_extra_to_loan_inr: extraInr,
    unemployment_start_month: unemploymentStartMonth,
    pf_corpus_inr: input.pf_corpus_inr,
    pf_annual_interest_rate_pct: input.pf_annual_interest_rate_pct,
    monthly_pf_addition_inr: input.monthly_pf_addition_inr,
    extra_prepayments:
      lumpInr > 0 ? [{ month: 1, amount_inr: lumpInr }] : undefined,
  };
}

function payoffFromScheduleTotals(
  metric: PayoffMetric,
  baseInterest: number,
  totals: ScheduleTotals,
  feeInr: number,
  minCash?: number,
): number {
  const interestSaved = roundInr(baseInterest - totals.total_interest_inr);
  switch (metric) {
    case "MINUS_TOTAL_INTEREST":
      return roundInr(-totals.total_interest_inr);
    case "MINUS_TOTAL_OUTFLOW":
      return roundInr(-(totals.total_paid_inr + feeInr));
    case "MIN_CASH_RUNWAY":
      return minCash ?? 0;
    case "INTEREST_SAVED_MINUS_FEES":
      return roundInr(interestSaved - feeInr);
    default:
      return roundInr(interestSaved - feeInr);
  }
}

export function runBlSchedule(
  input: GameInput,
  lumpInr: number,
  policy: BPolicyAction,
  extraInr: number,
): { totals: ScheduleTotals; scenarioId: string } {
  const { principal_inr, annual_interest_rate, tenure_months } = input;
  if (lumpInr <= 0 && extraInr <= 0) {
    const run = baselineSchedule(principal_inr, annual_interest_rate, tenure_months);
    return { totals: run.totals, scenarioId: "BASE" };
  }
  if (lumpInr > 0 && policy === "B_POL_EMI") {
    const run = schedulePrepayKeepTenure(
      principal_inr,
      annual_interest_rate,
      tenure_months,
      1,
      lumpInr,
      extraInr,
    );
    return { totals: run.totals, scenarioId: "PREPAY_CASH_LUMP_EMI" };
  }
  if (lumpInr > 0) {
    if (extraInr > 0) {
      const withExtra = scheduleFixedEmiWithMonthlyExtra(
        principal_inr,
        annual_interest_rate,
        tenure_months,
        extraInr,
        { month: 1, amount: lumpInr },
      );
      return { totals: withExtra.totals, scenarioId: "PREPAY_CASH_LUMP_TENURE_EXTRA" };
    }
    const run = schedulePrepayKeepEmi(
      principal_inr,
      annual_interest_rate,
      tenure_months,
      1,
      lumpInr,
    );
    return { totals: run.totals, scenarioId: "PREPAY_CASH_25L_TENURE" };
  }
  const run = scheduleFixedEmiWithMonthlyExtra(
    principal_inr,
    annual_interest_rate,
    tenure_months,
    extraInr,
  );
  return { totals: run.totals, scenarioId: "BASE_PLUS_MONTHLY_INFLOW" };
}

/** After month-1 prepay, lender bumps rate by `bumpBps` for remaining schedule. */
export function runBlScheduleWithRateBump(
  input: GameInput,
  lumpInr: number,
  policy: BPolicyAction,
  extraInr: number,
  bumpBps: number,
): { totals: ScheduleTotals; scenarioId: string } {
  const bumpedRate = input.annual_interest_rate + bumpBps / 100;
  if (lumpInr <= 0) {
    return runBlSchedule(input, 0, policy, extraInr);
  }
  const first = schedulePrepayKeepEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
    1,
    lumpInr,
  );
  const closing = first.rows[0]?.closing_inr ?? input.principal_inr;
  const remaining = Math.max(1, input.tenure_months - 1);
  const tail =
    extraInr > 0
      ? scheduleFixedEmiWithMonthlyExtra(closing, bumpedRate, remaining, extraInr)
      : baselineSchedule(closing, bumpedRate, remaining);
  const totalInterest = roundInr(
    first.totals.total_interest_inr + tail.totals.total_interest_inr,
  );
  const totalPaid = roundInr(first.totals.total_paid_inr + tail.totals.total_paid_inr);
  const payoffMonth = roundInr(first.totals.payoff_month + tail.totals.payoff_month - 1);
  return {
    totals: {
      total_interest_inr: totalInterest,
      total_paid_inr: totalPaid,
      total_prepayments_inr: first.totals.total_prepayments_inr,
      payoff_month: payoffMonth,
    },
    scenarioId: "PREPAY_RATE_BUMP",
  };
}

export function baselineInterest(input: GameInput): number {
  return baselineSchedule(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
  ).totals.total_interest_inr;
}

export function borrowerPayoffBl(
  input: GameInput,
  metric: PayoffMetric,
  lumpInr: number,
  policy: BPolicyAction,
  extraInr: number,
  feeInr: number,
): number {
  const baseInterest = baselineInterest(input);
  const { totals } = runBlSchedule(input, lumpInr, policy, extraInr);

  if (metric === "MIN_CASH_RUNWAY") {
    const cashflow = simulateCashflowSchedule({
      ...cashflowInputFromGame(input, 1, extraInr, lumpInr),
      unemployment_enabled: false,
    });
    return cashflow.min_cash_balance_inr;
  }

  return payoffFromScheduleTotals(metric, baseInterest, totals, feeInr);
}

export function lenderPayoffBl(
  objective: LenderObjective,
  feeInr: number,
  totals: ScheduleTotals,
): number {
  if (objective === "L_FEE_INCOME") return feeInr;
  return roundInr(totals.total_interest_inr);
}

function hSplitToStrategyId(split: HSplitAction): StrategyId | null {
  switch (split) {
    case "H_BLEND":
      return "STRATEGY_EQUITY_BLEND";
    case "H_PREPAY":
      return "STRATEGY_PREPAY_HEAVY";
    case "H_AGGR":
      return "STRATEGY_AGGRESSIVE_PREPAY";
    default:
      return null;
  }
}

export function strategyInputsFromGame(input: GameInput) {
  return {
    principal_inr: input.principal_inr,
    annual_interest_rate: input.annual_interest_rate,
    tenure_months: input.tenure_months,
    cash_inr: input.cash_inr,
    pf_corpus_inr: input.pf_corpus_inr,
    pf_annual_interest_rate_pct: input.pf_annual_interest_rate_pct,
    monthly_pf_addition_inr: input.monthly_pf_addition_inr,
    monthly_take_home_inr: input.monthly_take_home_inr,
    monthly_living_expense_inr: input.monthly_living_expense_inr,
    extra_monthly_income_inr: input.extra_monthly_income_inr,
    extra_income_post_tax: input.extra_income_post_tax,
    marginal_tax_rate_pct: input.marginal_tax_rate_pct,
    emergency_months_buffer: input.emergency_months_buffer,
    expected_equity_return_pct: input.expected_equity_return_pct,
    horizon_months: input.horizon_months ?? input.tenure_months,
    repayment_pct_of_take_home: input.repayment_pct_of_take_home,
  };
}

/** Custom household splits (§4.13.3) — game-only approximation via equity blend fractions. */
export function borrowerPayoffBh(
  input: GameInput,
  split: HSplitAction,
  metric: PayoffMetric,
): { payoff: number; scenarioId: string } {
  const strategyId = hSplitToStrategyId(split);
  const strategyInput = strategyInputsFromGame(input);

  if (strategyId) {
    const result = simulateStrategy(strategyId, strategyInput);
    const payoff =
      metric === "NET_WORTH_HORIZON"
        ? result.net_worth_at_horizon_inr
        : result.interest_saved_vs_base_inr;
    return { payoff, scenarioId: strategyId };
  }

  const loanFraction =
    split === "H_CUSTOM_70_30" ? 0.7 : split === "H_CUSTOM_30_70" ? 0.3 : 0.4;
  const prepayFraction = loanFraction;
  const blended = simulateStrategy("STRATEGY_EQUITY_BLEND", {
    ...strategyInput,
    cash_inr: roundInr(strategyInput.cash_inr * (prepayFraction / 0.4)),
  });
  const payoff =
    metric === "NET_WORTH_HORIZON"
      ? blended.net_worth_at_horizon_inr
      : blended.interest_saved_vs_base_inr;
  return { payoff, scenarioId: split };
}

function unemploymentStartMonth(employment: NEmploymentAction): number | null {
  switch (employment) {
    case "N_UE_M1":
      return 1;
    case "N_UE_M12":
      return 12;
    case "N_UE_M24":
      return 24;
    default:
      return null;
  }
}

export function borrowerPayoffBn(
  input: GameInput,
  metric: PayoffMetric,
  employment: NEmploymentAction,
  route: NPfRouteAction,
  lump: BLumpAction,
  extra: BExtraAction,
): { payoff: number; scenarioId: string } {
  const lumpInr = resolveLumpInr(lump, input);
  const extraInr = resolveExtraInr(extra);
  const baseInterest = baselineInterest(input);

  if (employment === "N_EMPLOYED") {
    if (lumpInr <= 0 && extraInr <= 0) {
      if (metric === "MIN_CASH_RUNWAY") {
        const cashflow = simulateCashflowSchedule({
          ...cashflowInputFromGame(input, 1, 0, 0),
          unemployment_enabled: false,
        });
        return { payoff: cashflow.min_cash_balance_inr, scenarioId: "BASE" };
      }
      return {
        payoff:
          metric === "MINUS_TOTAL_INTEREST"
            ? roundInr(-baseInterest)
            : 0,
        scenarioId: "BASE",
      };
    }
    if (metric === "MIN_CASH_RUNWAY") {
      const cashflow = simulateCashflowSchedule({
        ...cashflowInputFromGame(input, 1, extraInr, lumpInr),
        unemployment_enabled: false,
      });
      const scenarioId =
        lumpInr > 0
          ? "PREPAY_CASH_25L_TENURE"
          : "BASE_PLUS_MONTHLY_INFLOW";
      return { payoff: cashflow.min_cash_balance_inr, scenarioId };
    }
    const run = scheduleTimedPrepaysKeepEmi(
      input.principal_inr,
      input.annual_interest_rate,
      input.tenure_months,
      lumpInr > 0 ? [{ month: 1, amount_inr: lumpInr }] : [],
      extraInr,
    );
    const scenarioId =
      lumpInr > 0 ? "PREPAY_CASH_25L_TENURE" : "BASE_PLUS_MONTHLY_INFLOW";
    return {
      payoff: payoffFromScheduleTotals(metric, baseInterest, run.totals, 0),
      scenarioId,
    };
  }

  const uStart = unemploymentStartMonth(employment)!;
  const base = cashflowInputFromGame(input, uStart, extraInr, lumpInr);

  let result;
  let scenarioId: string;
  if (route === "N_PF_BRIDGE") {
    result = simulateUePfBridgeCashflow(base);
    scenarioId = "UE_PF_BRIDGE";
  } else if (route === "N_PF_DELAY") {
    result = simulateUeDelayPrepayCashflow(base);
    scenarioId = "UE_DELAY_PREPAY";
  } else {
    result = simulateUePfToLoanCashflow(base);
    scenarioId = "UE_PF_TO_LOAN";
  }

  return {
    payoff: payoffFromScheduleTotals(
      metric,
      baseInterest,
      result.totals,
      0,
      result.min_cash_balance_inr,
    ),
    scenarioId,
  };
}

export function cellKey(profile: {
  b_lump?: BLumpAction;
  b_policy?: BPolicyAction;
  b_extra?: BExtraAction;
  l_fee?: LFeeAction;
  l_rate?: import("./types").LRateAction;
  h_split?: HSplitAction;
  n_employment?: NEmploymentAction;
  n_pf_route?: NPfRouteAction;
}): string {
  const lump = profile.b_lump ?? "";
  const policy =
    lump === "B_PREPAY_0" ? "" : (profile.b_policy ?? "");
  return [
    lump,
    policy,
    profile.b_extra ?? "",
    profile.l_fee ?? "",
    profile.l_rate ?? "",
    profile.h_split ?? "",
    profile.n_employment ?? "",
    profile.n_pf_route ?? "",
  ].join("|");
}
