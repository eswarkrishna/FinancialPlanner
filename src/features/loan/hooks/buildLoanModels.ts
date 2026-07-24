import {
  baselineSchedule,
  scheduleFixedEmiWithMonthlyExtra,
  schedulePrepayKeepTenure,
  scheduleTimedPrepaysKeepEmi,
  simulateJl401kBridgeCashflow,
  simulateJl401kToLoanCashflow,
  simulateJlDelayPrepayCashflow,
  simulateUeDelayPrepayCashflow,
  simulateUePfBridgeCashflow,
  simulateUePfToLoanCashflow,
  simulateUs401kTranchesToLoanCashflow,
  simulateUsCashPlus401kCashflow,
  simulateUsCashflowSchedule,
} from "../../../lib/loan";
import { computeEmi, resolveKeepEmi } from "../../../lib/loan/emi";
import type { ParsedRateChange } from "../../../lib/loan/rateChanges";
import { loanRateConfigFrom } from "../../../lib/loan/rateSchedule";
import { computeK401JobLossWithdrawalPlan } from "../../../lib/k401/index";
import { computePfUnemploymentWithdrawalPlan } from "../../../lib/pf/index";
import type { LoanInput } from "../../../lib/schemas/index";
import type { Locale } from "../../../lib/locale/types";
import {
  cashflowBaseInput,
  monthly401kWithEmployerMatch,
  pfTrancheEvents,
  usCashflowBaseInput,
} from "./loanModelHelpers";
import { buildUkLoanModels } from "./buildUkLoanModels";
import type { PrepaySource } from "../../../lib/loan/scenarioViews";

import type { UkCashflowSimResult } from "../../../lib/loan/cashflowUk";

type UkScheduleShape = {
  emi_inr: number;
  rows: UkCashflowSimResult["rows"];
  totals: UkCashflowSimResult["totals"];
  min_cash_balance_inr: number;
  warnings: string[];
};

export type BuiltLoanModels = {
  v: LoanInput;
  base: ReturnType<typeof baselineSchedule> | UkScheduleShape;
  baseSalarySweep: ReturnType<typeof scheduleFixedEmiWithMonthlyExtra> | UkScheduleShape | null;
  prepayTenure:
    | ReturnType<typeof schedulePrepayKeepTenure>
    | ReturnType<typeof simulateUsCashflowSchedule>
    | UkScheduleShape
    | null;
  prepayEmi:
    | ReturnType<typeof scheduleFixedEmiWithMonthlyExtra>
    | ReturnType<typeof simulateUsCashflowSchedule>
    | UkScheduleShape
    | null;
  baseInflow: ReturnType<typeof scheduleFixedEmiWithMonthlyExtra> | UkScheduleShape | null;
  prepayEmiInflow:
    | ReturnType<typeof scheduleFixedEmiWithMonthlyExtra>
    | ReturnType<typeof simulateUsCashflowSchedule>
    | UkScheduleShape
    | null;
  cashflowNoPf: ReturnType<typeof scheduleTimedPrepaysKeepEmi> | UkScheduleShape | null;
  cashflowPlusPf:
    | ReturnType<typeof scheduleTimedPrepaysKeepEmi>
    | ReturnType<typeof simulateUsCashPlus401kCashflow>
    | UkScheduleShape
    | null;
  uePfToLoan:
    | ReturnType<typeof scheduleTimedPrepaysKeepEmi>
    | ReturnType<typeof simulateUePfToLoanCashflow>
    | ReturnType<typeof simulateJl401kToLoanCashflow>
    | ReturnType<typeof simulateUs401kTranchesToLoanCashflow>
    | UkScheduleShape
    | null;
  uePfBridge:
    | ReturnType<typeof simulateUePfBridgeCashflow>
    | ReturnType<typeof simulateJl401kBridgeCashflow>
    | UkScheduleShape
    | null;
  ueDelayPrepay:
    | ReturnType<typeof simulateUeDelayPrepayCashflow>
    | ReturnType<typeof simulateJlDelayPrepayCashflow>
    | UkScheduleShape
    | null;
  stagedPrepay: ReturnType<typeof scheduleTimedPrepaysKeepEmi> | UkScheduleShape | null;
  canPrepay: boolean;
  monthlyExtra: number;
  salaryRecurring: number;
  prepaySource: PrepaySource;
  effectiveLiquidInr: number;
  k401Plan: ReturnType<typeof computeK401JobLossWithdrawalPlan>;
  monthly401kWithMatch: number;
};

export function buildLoanModels(
  v: LoanInput,
  prepaySource: PrepaySource,
  effectiveLiquidInr: number,
  stagedEvents: { month: number; amount_inr: number }[],
  locale: Locale,
  rateChanges: ParsedRateChange[] = [],
): BuiltLoanModels {
  if (locale === "UK") {
    return buildUkLoanModels(v, prepaySource, stagedEvents);
  }
  const x = v.monthly_cash_to_loan_inr;
  const salaryRecurring = v.monthly_salary_inr;
  const recurringToLoan = x + salaryRecurring;
  const rateConfig = loanRateConfigFrom(
    v.annual_interest_rate,
    v.rate_type ?? "fixed",
    rateChanges,
  );
  const keepEmi = resolveKeepEmi(
    v.principal_inr,
    v.annual_interest_rate,
    v.tenure_months,
    v.emi_basis ?? "baseline",
    v.current_emi_inr ?? 0,
  );
  const formulaEmi = computeEmi(
    v.principal_inr,
    v.annual_interest_rate,
    v.tenure_months,
  );
  const emiOverride = keepEmi !== formulaEmi ? keepEmi : undefined;
  const base = baselineSchedule(
    v.principal_inr,
    v.annual_interest_rate,
    v.tenure_months,
    rateConfig,
    emiOverride,
  );
  const baseSalarySweep =
    salaryRecurring > 0
      ? scheduleFixedEmiWithMonthlyExtra(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          salaryRecurring,
          undefined,
          emiOverride,
        )
      : null;
  const k401Plan = computeK401JobLossWithdrawalPlan(
    v.pf_corpus_inr,
    v.vested_fraction_pct,
  );
  const isUs = locale === "US";
  const vested401kBalance = isUs ? k401Plan.vested_balance_usd : v.pf_corpus_inr;
  const oneTimePrepayInr =
    prepaySource === "cash"
      ? v.cash_inr
      : prepaySource === "pf"
        ? vested401kBalance
        : effectiveLiquidInr;
  const canPrepay = oneTimePrepayInr > 0;
  const prepayTenure = canPrepay
    ? schedulePrepayKeepTenure(
        v.principal_inr,
        v.annual_interest_rate,
        v.tenure_months,
        1,
        oneTimePrepayInr,
        salaryRecurring,
      )
    : null;
  const prepayEmi = canPrepay
    ? isUs && prepaySource === "pf"
      ? simulateUsCashflowSchedule({
          ...usCashflowBaseInput(v, salaryRecurring),
          job_loss_enabled: false,
          employed_401k_prepayments: [{ month: 1, gross_usd: oneTimePrepayInr }],
        })
      : scheduleFixedEmiWithMonthlyExtra(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          salaryRecurring,
          { month: 1, amount: oneTimePrepayInr },
          emiOverride,
        )
    : null;
  const baseInflow =
    x > 0
      ? scheduleFixedEmiWithMonthlyExtra(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          x,
          undefined,
          emiOverride,
        )
      : null;
  const prepayEmiInflow =
    canPrepay && x > 0
      ? isUs && prepaySource === "pf"
        ? simulateUsCashflowSchedule({
            ...usCashflowBaseInput(v, x),
            job_loss_enabled: false,
            employed_401k_prepayments: [{ month: 1, gross_usd: oneTimePrepayInr }],
          })
        : scheduleFixedEmiWithMonthlyExtra(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            x,
            { month: 1, amount: oneTimePrepayInr },
            emiOverride,
          )
      : null;
  const pfPlan = computePfUnemploymentWithdrawalPlan(
    v.pf_corpus_inr,
    v.pf_annual_interest_rate_pct,
    v.monthly_pf_addition_inr,
  );
  const cashflowNoPf =
    v.cash_inr > 0 || x > 0
      ? scheduleTimedPrepaysKeepEmi(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          [{ month: 1, amount_inr: v.cash_inr }],
          recurringToLoan,
          emiOverride,
        )
      : null;
  const cashflowPlusPf =
    (v.cash_inr > 0 || x > 0) && v.pf_corpus_inr > 0
      ? isUs
        ? simulateUsCashPlus401kCashflow({
            ...usCashflowBaseInput(v, recurringToLoan),
            cash_prepay_month1_inr: v.cash_inr,
          })
        : scheduleTimedPrepaysKeepEmi(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            [
              { month: 1, amount_inr: v.cash_inr },
              ...pfTrancheEvents(
                pfPlan.tranche1_inr,
                pfPlan.tranche2_inr,
                v.unemployment_start_month,
              ),
            ],
            recurringToLoan,
            emiOverride,
          )
      : null;
  const uePfToLoan =
    v.pf_corpus_inr > 0
      ? v.unemployment_mode
        ? isUs
          ? simulateJl401kToLoanCashflow(usCashflowBaseInput(v, recurringToLoan))
          : simulateUePfToLoanCashflow(cashflowBaseInput(v, recurringToLoan))
        : isUs
          ? simulateUs401kTranchesToLoanCashflow(
              usCashflowBaseInput(v, recurringToLoan),
            )
          : scheduleTimedPrepaysKeepEmi(
              v.principal_inr,
              v.annual_interest_rate,
              v.tenure_months,
              pfTrancheEvents(
                pfPlan.tranche1_inr,
                pfPlan.tranche2_inr,
                v.unemployment_start_month,
              ),
              recurringToLoan,
              emiOverride,
            )
      : null;
  const uePfBridge =
    v.unemployment_mode && v.pf_corpus_inr > 0
      ? isUs
        ? simulateJl401kBridgeCashflow(usCashflowBaseInput(v, recurringToLoan))
        : simulateUePfBridgeCashflow(cashflowBaseInput(v, recurringToLoan))
      : null;
  const ueDelayPrepay =
    v.unemployment_mode && v.pf_corpus_inr > 0
      ? isUs
        ? simulateJlDelayPrepayCashflow(usCashflowBaseInput(v, recurringToLoan))
        : simulateUeDelayPrepayCashflow(cashflowBaseInput(v, recurringToLoan))
      : null;
  const stagedPrepay =
    stagedEvents.length > 0
      ? scheduleTimedPrepaysKeepEmi(
          v.principal_inr,
          v.annual_interest_rate,
          v.tenure_months,
          stagedEvents,
          recurringToLoan,
          emiOverride,
        )
      : null;

  return {
    v,
    base,
    baseSalarySweep,
    prepayTenure,
    prepayEmi,
    baseInflow,
    prepayEmiInflow,
    cashflowNoPf,
    cashflowPlusPf,
    uePfToLoan,
    uePfBridge,
    ueDelayPrepay,
    stagedPrepay,
    canPrepay,
    monthlyExtra: x,
    salaryRecurring,
    prepaySource,
    effectiveLiquidInr,
    k401Plan,
    monthly401kWithMatch: monthly401kWithEmployerMatch(v),
  };
}
