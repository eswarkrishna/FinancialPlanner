import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepEmi,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
  type ScheduleTotals,
} from "../loan/amortisation";
import { roundInr } from "../money";
import { computePfUnemploymentWithdrawalPlan } from "../pf/unemployment";
import { simulateStrategy } from "../strategy/simulate";
import type { StrategyId } from "../strategy/types";
import { DEFAULT_PREPAYMENT_FEE_PCT, EXTRA_HIGH_INR, EXTRA_LOW_INR, REFERENCE_PREPAY_25_INR } from "./constants";
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

export function resolveLumpInr(lump: BLumpAction, cashInr: number): number {
  const deployable = Math.max(0, cashInr);
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
    const run = schedulePrepayKeepEmi(
      principal_inr,
      annual_interest_rate,
      tenure_months,
      1,
      lumpInr,
    );
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
  const interestSaved = roundInr(baseInterest - totals.total_interest_inr);

  switch (metric) {
    case "MINUS_TOTAL_INTEREST":
      return roundInr(-totals.total_interest_inr);
    case "MINUS_TOTAL_OUTFLOW":
      return roundInr(-(totals.total_paid_inr + feeInr));
    case "INTEREST_SAVED_MINUS_FEES":
      return roundInr(interestSaved - feeInr);
    default:
      return roundInr(interestSaved - feeInr);
  }
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
  const equityFraction = roundInr(1 - prepayFraction);
  void equityFraction;
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

function buildUePrepayEvents(
  input: GameInput,
  employment: NEmploymentAction,
  route: NPfRouteAction,
  lumpInr: number,
): { month: number; amount_inr: number }[] {
  const events: { month: number; amount_inr: number }[] = [];
  if (lumpInr > 0) {
    events.push({ month: 1, amount_inr: lumpInr });
  }
  if (employment === "N_EMPLOYED") {
    return events;
  }

  const u = unemploymentStartMonth(employment);
  if (u == null) return events;

  const plan = computePfUnemploymentWithdrawalPlan(
    input.pf_corpus_inr,
    input.pf_annual_interest_rate_pct,
    input.monthly_pf_addition_inr,
  );

  const t2Month = u + 11;

  if (route === "N_PF_DELAY") {
    events.push({ month: t2Month, amount_inr: plan.tranche2_inr });
    return events;
  }

  if (route === "N_PF_BRIDGE") {
    events.push({ month: u, amount_inr: roundInr(plan.tranche1_inr * 0.5) });
    events.push({ month: t2Month, amount_inr: plan.tranche2_inr });
    return events;
  }

  events.push({ month: u, amount_inr: plan.tranche1_inr });
  events.push({ month: t2Month, amount_inr: plan.tranche2_inr });
  return events;
}

export function borrowerPayoffBn(
  input: GameInput,
  metric: PayoffMetric,
  employment: NEmploymentAction,
  route: NPfRouteAction,
  lump: BLumpAction,
  extra: BExtraAction,
): { payoff: number; scenarioId: string } {
  const lumpInr = resolveLumpInr(lump, input.cash_inr);
  const extraInr = resolveExtraInr(extra);
  const baseInterest = baselineInterest(input);

  if (employment === "N_EMPLOYED" && lumpInr <= 0 && extraInr <= 0) {
    return {
      payoff:
        metric === "MINUS_TOTAL_INTEREST"
          ? roundInr(-baseInterest)
          : 0,
      scenarioId: "BASE",
    };
  }

  const events = buildUePrepayEvents(input, employment, route, lumpInr);
  const run = scheduleTimedPrepaysKeepEmi(
    input.principal_inr,
    input.annual_interest_rate,
    input.tenure_months,
    events,
    extraInr,
  );

  const interestSaved = roundInr(baseInterest - run.totals.total_interest_inr);
  const payoff =
    metric === "MINUS_TOTAL_INTEREST"
      ? roundInr(-run.totals.total_interest_inr)
      : interestSaved;

  const scenarioId =
    employment === "N_EMPLOYED"
      ? "BASE"
      : route === "N_PF_LOAN"
        ? "UE_PF_TO_LOAN"
        : route === "N_PF_BRIDGE"
          ? "UE_PF_BRIDGE"
          : "UE_DELAY_PREPAY";

  return { payoff, scenarioId };
}

export function cellKey(profile: {
  b_lump?: BLumpAction;
  b_policy?: BPolicyAction;
  b_extra?: BExtraAction;
  l_fee?: LFeeAction;
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
    profile.h_split ?? "",
    profile.n_employment ?? "",
    profile.n_pf_route ?? "",
  ].join("|");
}
