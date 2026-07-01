import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildCumulativeInterestCurve,
  buildPrincipalCurve,
  effectiveBrokerageLiquidUsd,
  effectiveGoldLiquidInr,
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
  type CashflowSimResult,
  type ScheduleRow,
  type UsCashflowSimResult,
} from "../../../lib/loan";
import {
  downloadTextFile,
  scheduleToCsv,
  scenarioToJson,
  type ScenarioExportPayload,
} from "../../../lib/export";
import { formatMoney } from "../../../lib/locale/formatMoney";
import type { Locale } from "../../../lib/locale/types";
import {
  loanFormFromScenario,
  referenceScenarioForLocale,
  useLocale,
} from "../../locale/LocaleContext";
import {
  loanInputSchema,
  type LoanInput,
} from "../../../lib/schemas/index";
import { computePfUnemploymentWithdrawalPlan } from "../../../lib/pf/index";
import {
  computeK401JobLossWithdrawalPlan,
  computeMonthlyEmployerMatchUsd,
} from "../../../lib/k401/index";
import { trancheMonthsFromStart } from "../../../lib/shared/trancheMonths";
import {
  newStagedPrepayEntry,
  parseStagedPrepays,
  type StagedPrepayEntry,
} from "../components/StagedPrepayEditor";

export type ScenarioView =
  | "BASE"
  | "PREPAY_TENURE"
  | "PREPAY_EMI"
  | "BASE_INFLOW"
  | "PREPAY_EMI_INFLOW"
  | "CASHFLOW_NO_PF"
  | "CASHFLOW_PLUS_PF"
  | "UE_PF_TO_LOAN"
  | "UE_PF_BRIDGE"
  | "UE_DELAY_PREPAY"
  | "STAGED_PREPAY";

type ScheduleBundle = {
  rows: ScheduleRow[];
  totals: {
    payoff_month: number;
    total_interest_inr: number;
    total_paid_inr: number;
    total_prepayments_inr?: number;
  };
  cashBalances?: number[];
  warnings?: string[];
};

function isCashflowResult(
  value:
    | { rows: ScheduleRow[]; totals: ScheduleBundle["totals"] }
    | CashflowSimResult
    | UsCashflowSimResult,
): value is CashflowSimResult | UsCashflowSimResult {
  return "min_cash_balance_inr" in value;
}

function scenarioViewIsAvailable(
  view: ScenarioView,
  models: {
    baseInflow: unknown;
    prepayTenure: unknown;
    prepayEmi: unknown;
    prepayEmiInflow: unknown;
    cashflowNoPf: unknown;
    cashflowPlusPf: unknown;
    uePfToLoan: unknown;
    uePfBridge: unknown;
    ueDelayPrepay: unknown;
    stagedPrepay: unknown;
  },
): boolean {
  switch (view) {
    case "BASE":
      return true;
    case "BASE_INFLOW":
      return models.baseInflow != null;
    case "PREPAY_TENURE":
      return models.prepayTenure != null;
    case "PREPAY_EMI":
      return models.prepayEmi != null;
    case "PREPAY_EMI_INFLOW":
      return models.prepayEmiInflow != null;
    case "CASHFLOW_NO_PF":
      return models.cashflowNoPf != null;
    case "CASHFLOW_PLUS_PF":
      return models.cashflowPlusPf != null;
    case "UE_PF_TO_LOAN":
      return models.uePfToLoan != null;
    case "UE_PF_BRIDGE":
      return models.uePfBridge != null;
    case "UE_DELAY_PREPAY":
      return models.ueDelayPrepay != null;
    case "STAGED_PREPAY":
      return models.stagedPrepay != null;
    default:
      return false;
  }
}

export type PrepaySource = "cash" | "pf" | "gold";

export function prepaySourceComparisonWord(
  source: PrepaySource,
  locale: Locale = "IN",
): string {
  if (source === "cash") return "cash";
  if (source === "pf") return locale === "US" ? "401(k)" : "PF";
  return locale === "US" ? "brokerage" : "gold";
}

export function prepaySourceScheduleLabel(
  source: PrepaySource,
  locale: Locale = "IN",
): string {
  if (source === "cash") return "Cash";
  if (source === "pf") return locale === "US" ? "401(k)" : "PF";
  return locale === "US" ? "Brokerage" : "Gold";
}

export function prepaySourceHintLabel(
  source: PrepaySource,
  locale: Locale = "IN",
): string {
  if (source === "cash") return "Cash";
  if (source === "pf") return locale === "US" ? "401(k) vested" : "PF account";
  return locale === "US" ? "Brokerage (liquid)" : "Gold (liquid)";
}

type ComparisonRow = {
  id: string;
  label: string;
  payoffMonth: number;
  totalInterest: number;
  totalPaid: number;
  deltaVsBaseMonths: number;
  deltaInterestVsBase: number;
  minCashBalance?: number;
};

const SCENARIO_LABELS: Record<ScenarioView, string> = {
  BASE: "BASE",
  PREPAY_TENURE: "PREPAY_TENURE",
  PREPAY_EMI: "PREPAY_EMI",
  BASE_INFLOW: "BASE_PLUS_MONTHLY_INFLOW",
  PREPAY_EMI_INFLOW: "PREPAY_EMI_PLUS_MONTHLY_INFLOW",
  CASHFLOW_NO_PF: "CASHFLOW_NO_PF",
  CASHFLOW_PLUS_PF: "CASHFLOW_PLUS_PF",
  UE_PF_TO_LOAN: "UE_PF_TO_LOAN",
  UE_PF_BRIDGE: "UE_PF_BRIDGE",
  UE_DELAY_PREPAY: "UE_DELAY_PREPAY",
  STAGED_PREPAY: "STAGED_PREPAY",
};

const EMPTY_LOAN_FORM: Record<keyof LoanInput, string> = {
  principal_inr: "",
  annual_interest_rate: "",
  tenure_months: "",
  start_date: "",
  cash_inr: "",
  monthly_salary_inr: "",
  pf_corpus_inr: "",
  pf_annual_interest_rate_pct: "",
  monthly_pf_addition_inr: "",
  gold_liquid_inr: "",
  gold_haircut_enabled: "false",
  gold_haircut_pct: "",
  monthly_cash_to_loan_inr: "",
  unemployment_mode: "false",
  unemployment_start_month: "1",
  monthly_living_expense_inr: "",
  monthly_income_inr: "",
  monthly_uib_inr: "",
  vested_fraction_pct: "100",
  early_withdrawal_tax_withholding_pct: "22",
  employer_match_rate_pct: "50",
  employer_match_cap_pct_of_salary: "6",
  annual_salary_inr: "",
  employment_type: "w2",
  pmi_monthly_inr: "",
  pmi_active: "true",
  hsa_balance_inr: "",
  monthly_health_premium_inr: "",
};

function monthly401kWithEmployerMatch(v: LoanInput): number {
  const match = computeMonthlyEmployerMatchUsd({
    annual_salary_usd: v.annual_salary_inr,
    monthly_401k_deferral_usd: v.monthly_pf_addition_inr,
    employer_match_rate_pct: v.employer_match_rate_pct,
    employer_match_cap_pct_of_salary: v.employer_match_cap_pct_of_salary,
    employment_type: v.employment_type,
  });
  return v.monthly_pf_addition_inr + match;
}

function usCashflowBaseInput(v: LoanInput, recurringToLoan: number) {
  return {
    principal_inr: v.principal_inr,
    annual_interest_rate: v.annual_interest_rate,
    tenure_months: v.tenure_months,
    cash_inr: v.cash_inr,
    monthly_income_inr: v.monthly_income_inr,
    monthly_living_expense_inr: v.monthly_living_expense_inr,
    monthly_extra_to_loan_inr: recurringToLoan,
    monthly_uib_inr: v.monthly_uib_inr,
    job_loss_start_month: v.unemployment_start_month,
    k401_balance_inr: v.pf_corpus_inr,
    vested_fraction_pct: v.vested_fraction_pct,
    early_withdrawal_tax_withholding_pct: v.early_withdrawal_tax_withholding_pct,
    pmi_monthly_inr: v.pmi_monthly_inr,
    pmi_active: v.pmi_active,
    hsa_balance_inr: v.hsa_balance_inr,
    monthly_health_premium_inr: v.monthly_health_premium_inr,
  };
}

function pfTrancheEvents(
  tranche1Amount: number,
  tranche2Amount: number,
  startMonth: number,
): { month: number; amount_inr: number }[] {
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  return [
    { month: tranche1Month, amount_inr: tranche1Amount },
    { month: tranche2Month, amount_inr: tranche2Amount },
  ];
}

function usPfTrancheLabel(startMonth: number): string {
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  return `JL 401(k) to loan (50% m${tranche1Month} + 50% m${tranche2Month})`;
}

function inPfTrancheLabel(startMonth: number): string {
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  return `UE PF to loan (75% m${tranche1Month} + 25%+interest m${tranche2Month})`;
}

function cashflowBaseInput(v: LoanInput, recurringToLoan: number) {
  return {
    principal_inr: v.principal_inr,
    annual_interest_rate: v.annual_interest_rate,
    tenure_months: v.tenure_months,
    cash_inr: v.cash_inr,
    monthly_income_inr: v.monthly_income_inr,
    monthly_living_expense_inr: v.monthly_living_expense_inr,
    monthly_extra_to_loan_inr: recurringToLoan,
    unemployment_start_month: v.unemployment_start_month,
    pf_corpus_inr: v.pf_corpus_inr,
    pf_annual_interest_rate_pct: v.pf_annual_interest_rate_pct,
    monthly_pf_addition_inr: v.monthly_pf_addition_inr,
  };
}

export function useLoanModels() {
  const { locale } = useLocale();
  const [inputs, setInputs] =
    useState<Record<keyof LoanInput, string>>(EMPTY_LOAN_FORM);
  const [scenarioView, setScenarioView] = useState<ScenarioView>("BASE");
  const [prepaySource, setPrepaySource] = useState<PrepaySource>("cash");
  const [stagedPrepays, setStagedPrepays] = useState<StagedPrepayEntry[]>([]);

  const parsed = useMemo(() => {
    return loanInputSchema.safeParse({
      principal_inr: inputs.principal_inr,
      annual_interest_rate: inputs.annual_interest_rate,
      tenure_months: inputs.tenure_months,
      start_date: inputs.start_date || undefined,
      cash_inr: inputs.cash_inr || 0,
      monthly_salary_inr: inputs.monthly_salary_inr || 0,
      pf_corpus_inr: inputs.pf_corpus_inr || 0,
      pf_annual_interest_rate_pct: inputs.pf_annual_interest_rate_pct || 0,
      monthly_pf_addition_inr: inputs.monthly_pf_addition_inr || 0,
      gold_liquid_inr: inputs.gold_liquid_inr || 0,
      gold_haircut_enabled: inputs.gold_haircut_enabled === "true",
      gold_haircut_pct: inputs.gold_haircut_pct || 0,
      monthly_cash_to_loan_inr: inputs.monthly_cash_to_loan_inr || 0,
      unemployment_mode: inputs.unemployment_mode === "true",
      unemployment_start_month: inputs.unemployment_start_month || 1,
      monthly_living_expense_inr: inputs.monthly_living_expense_inr || 0,
      monthly_income_inr: inputs.monthly_income_inr || 0,
      monthly_uib_inr: inputs.monthly_uib_inr || 0,
      vested_fraction_pct: inputs.vested_fraction_pct || 100,
      early_withdrawal_tax_withholding_pct:
        inputs.early_withdrawal_tax_withholding_pct || 22,
      employer_match_rate_pct: inputs.employer_match_rate_pct || 50,
      employer_match_cap_pct_of_salary:
        inputs.employer_match_cap_pct_of_salary || 6,
      annual_salary_inr: inputs.annual_salary_inr || 0,
      employment_type:
        inputs.employment_type === "self_employed" ? "self_employed" : "w2",
      pmi_monthly_inr: inputs.pmi_monthly_inr || 0,
      pmi_active: inputs.pmi_active !== "false",
      hsa_balance_inr: inputs.hsa_balance_inr || 0,
      monthly_health_premium_inr: inputs.monthly_health_premium_inr || 0,
    });
  }, [inputs]);

  const effectiveLiquidInr = useMemo(() => {
    if (!parsed.success) return 0;
    const v = parsed.data;
    if (locale === "US") {
      return effectiveBrokerageLiquidUsd(
        v.gold_liquid_inr,
        v.gold_haircut_enabled,
        v.gold_haircut_pct,
      );
    }
    return effectiveGoldLiquidInr(
      v.gold_liquid_inr,
      v.gold_haircut_enabled,
      v.gold_haircut_pct,
    );
  }, [parsed, locale]);

  const stagedEvents = useMemo(() => parseStagedPrepays(stagedPrepays), [stagedPrepays]);

  const models = useMemo(() => {
    if (!parsed.success) return null;
    const v = parsed.data;
    const x = v.monthly_cash_to_loan_inr;
    const salaryRecurring = v.monthly_salary_inr;
    const recurringToLoan = x + salaryRecurring;
    const base = scheduleFixedEmiWithMonthlyExtra(
      v.principal_inr,
      v.annual_interest_rate,
      v.tenure_months,
      salaryRecurring,
    );
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
    const usEmployed401kPrepay =
      isUs && prepaySource === "pf" && canPrepay
        ? simulateUsCashflowSchedule({
            ...usCashflowBaseInput(v, salaryRecurring),
            job_loss_enabled: false,
            employed_401k_prepayments: [{ month: 1, gross_usd: oneTimePrepayInr }],
          })
        : null;
    const prepayTenure = canPrepay
      ? isUs && prepaySource === "pf"
        ? usEmployed401kPrepay
        : schedulePrepayKeepTenure(
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
        ? usEmployed401kPrepay
        : scheduleFixedEmiWithMonthlyExtra(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            salaryRecurring,
            { month: 1, amount: oneTimePrepayInr },
          )
      : null;
    const baseInflow =
      x > 0
        ? scheduleFixedEmiWithMonthlyExtra(
            v.principal_inr,
            v.annual_interest_rate,
            v.tenure_months,
            recurringToLoan,
          )
        : null;
    const prepayEmiInflow =
      canPrepay && x > 0
        ? isUs && prepaySource === "pf"
          ? simulateUsCashflowSchedule({
              ...usCashflowBaseInput(v, recurringToLoan),
              job_loss_enabled: false,
              employed_401k_prepayments: [{ month: 1, gross_usd: oneTimePrepayInr }],
            })
          : scheduleFixedEmiWithMonthlyExtra(
              v.principal_inr,
              v.annual_interest_rate,
              v.tenure_months,
              recurringToLoan,
              { month: 1, amount: oneTimePrepayInr },
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
          )
        : null;

    return {
      v,
      base,
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
      prepaySource,
      effectiveLiquidInr,
      k401Plan,
      monthly401kWithMatch: monthly401kWithEmployerMatch(v),
    };
  }, [parsed, prepaySource, effectiveLiquidInr, stagedEvents, locale]);

  useEffect(() => {
    if (!models) return;
    if (!scenarioViewIsAvailable(scenarioView, models)) {
      setScenarioView("BASE");
    }
  }, [models, scenarioView]);

  const baseInterest = models?.base.totals.total_interest_inr ?? 0;

  const comparisonRows = useMemo((): ComparisonRow[] => {
    if (!models) return [];
    const baseM = models.base.totals.payoff_month;
    const row = (
      id: string,
      label: string,
      payoffMonth: number,
      totalInterest: number,
      totalPaid: number,
      minCashBalance?: number,
    ): ComparisonRow => ({
      id,
      label,
      payoffMonth,
      totalInterest,
      totalPaid,
      deltaVsBaseMonths: baseM - payoffMonth,
      deltaInterestVsBase: baseInterest - totalInterest,
      minCashBalance,
    });

    const rows: ComparisonRow[] = [
      row(
        "BASE",
        "BASE",
        models.base.totals.payoff_month,
        models.base.totals.total_interest_inr,
        models.base.totals.total_paid_inr,
      ),
    ];
    if (models.baseInflow) {
      rows.push(
        row(
          "BASE_INFLOW",
          `BASE + ${formatMoney(models.monthlyExtra, locale)}/mo to loan`,
          models.baseInflow.totals.payoff_month,
          models.baseInflow.totals.total_interest_inr,
          models.baseInflow.totals.total_paid_inr,
        ),
      );
    }
    if (models.prepayTenure) {
      rows.push(
        row(
          "PREPAY_TENURE",
          `Prepay from ${prepaySourceComparisonWord(models.prepaySource, locale)} + keep tenure`,
          models.prepayTenure.totals.payoff_month,
          models.prepayTenure.totals.total_interest_inr,
          models.prepayTenure.totals.total_paid_inr,
        ),
      );
    }
    if (models.prepayEmi) {
      rows.push(
        row(
          "PREPAY_EMI",
          `Prepay from ${prepaySourceComparisonWord(models.prepaySource, locale)} + keep EMI`,
          models.prepayEmi.totals.payoff_month,
          models.prepayEmi.totals.total_interest_inr,
          models.prepayEmi.totals.total_paid_inr,
        ),
      );
    }
    if (models.prepayEmiInflow) {
      rows.push(
        row(
          "PREPAY_EMI_INFLOW",
          `Prepay from ${prepaySourceComparisonWord(models.prepaySource, locale)} + keep EMI + ${formatMoney(models.monthlyExtra, locale)}/mo`,
          models.prepayEmiInflow.totals.payoff_month,
          models.prepayEmiInflow.totals.total_interest_inr,
          models.prepayEmiInflow.totals.total_paid_inr,
        ),
      );
    }
    if (models.cashflowNoPf) {
      rows.push(
        row(
          "CASHFLOW_NO_PF",
          "Cash prepay (month 1) + monthly cashflow",
          models.cashflowNoPf.totals.payoff_month,
          models.cashflowNoPf.totals.total_interest_inr,
          models.cashflowNoPf.totals.total_paid_inr,
        ),
      );
    }
    if (models.cashflowPlusPf) {
      rows.push(
        row(
          "CASHFLOW_PLUS_PF",
          locale === "US"
            ? "Cash + monthly cashflow + 401(k) tranches"
            : "Cash + monthly cashflow + PF tranches",
          models.cashflowPlusPf.totals.payoff_month,
          models.cashflowPlusPf.totals.total_interest_inr,
          models.cashflowPlusPf.totals.total_paid_inr,
        ),
      );
    }
    if (models.uePfToLoan) {
      const ue = models.uePfToLoan;
      let minCash: number | undefined;
      if (isCashflowResult(ue)) {
        minCash = ue.min_cash_balance_inr;
      }
      const startMonth = models.v.unemployment_start_month;
      rows.push(
        row(
          "UE_PF_TO_LOAN",
          locale === "US"
            ? usPfTrancheLabel(startMonth)
            : inPfTrancheLabel(startMonth),
          ue.totals.payoff_month,
          ue.totals.total_interest_inr,
          ue.totals.total_paid_inr,
          minCash,
        ),
      );
    }
    if (models.uePfBridge) {
      rows.push(
        row(
          "UE_PF_BRIDGE",
          locale === "US"
            ? "JL 401(k) bridge (tranche 1 → cash, tranche 2 split)"
            : "UE PF bridge (tranche 1 → cash, tranche 2 split)",
          models.uePfBridge.totals.payoff_month,
          models.uePfBridge.totals.total_interest_inr,
          models.uePfBridge.totals.total_paid_inr,
          models.uePfBridge.min_cash_balance_inr,
        ),
      );
    }
    if (models.ueDelayPrepay) {
      rows.push(
        row(
          "UE_DELAY_PREPAY",
          locale === "US"
            ? "JL delay prepay (tranche 1 → cash, tranche 2 → loan)"
            : "UE delay prepay (tranche 1 → cash, tranche 2 → loan)",
          models.ueDelayPrepay.totals.payoff_month,
          models.ueDelayPrepay.totals.total_interest_inr,
          models.ueDelayPrepay.totals.total_paid_inr,
          models.ueDelayPrepay.min_cash_balance_inr,
        ),
      );
    }
    if (models.stagedPrepay) {
      rows.push(
        row(
          "STAGED_PREPAY",
          `Custom staged prepay (${stagedEvents.length} event${stagedEvents.length === 1 ? "" : "s"})`,
          models.stagedPrepay.totals.payoff_month,
          models.stagedPrepay.totals.total_interest_inr,
          models.stagedPrepay.totals.total_paid_inr,
        ),
      );
    }
    return rows;
  }, [models, baseInterest, stagedEvents.length, locale]);

  const withdrawalPlan = useMemo(() => {
    if (!models) return null;
    if (locale === "US") {
      return computeK401JobLossWithdrawalPlan(
        models.v.pf_corpus_inr,
        models.v.vested_fraction_pct,
      );
    }
    return computePfUnemploymentWithdrawalPlan(
      models.v.pf_corpus_inr,
      models.v.pf_annual_interest_rate_pct,
      models.v.monthly_pf_addition_inr,
    );
  }, [models, locale]);

  const activeBundle = useMemo((): ScheduleBundle | null => {
    if (!models) return null;

    if (scenarioView === "BASE") {
      return { rows: models.base.rows, totals: models.base.totals };
    }
    if (scenarioView === "PREPAY_TENURE" && models.prepayTenure) {
      if (isCashflowResult(models.prepayTenure)) {
        return {
          rows: models.prepayTenure.rows,
          totals: models.prepayTenure.totals,
          cashBalances: models.prepayTenure.rows.map((r) => r.cash_balance_inr),
          warnings: models.prepayTenure.warnings,
        };
      }
      return { rows: models.prepayTenure.rows, totals: models.prepayTenure.totals };
    }
    if (scenarioView === "PREPAY_EMI" && models.prepayEmi) {
      if (isCashflowResult(models.prepayEmi)) {
        return {
          rows: models.prepayEmi.rows,
          totals: models.prepayEmi.totals,
          cashBalances: models.prepayEmi.rows.map((r) => r.cash_balance_inr),
          warnings: models.prepayEmi.warnings,
        };
      }
      return { rows: models.prepayEmi.rows, totals: models.prepayEmi.totals };
    }
    if (scenarioView === "BASE_INFLOW" && models.baseInflow) {
      return { rows: models.baseInflow.rows, totals: models.baseInflow.totals };
    }
    if (scenarioView === "PREPAY_EMI_INFLOW" && models.prepayEmiInflow) {
      if (isCashflowResult(models.prepayEmiInflow)) {
        return {
          rows: models.prepayEmiInflow.rows,
          totals: models.prepayEmiInflow.totals,
          cashBalances: models.prepayEmiInflow.rows.map((r) => r.cash_balance_inr),
          warnings: models.prepayEmiInflow.warnings,
        };
      }
      return {
        rows: models.prepayEmiInflow.rows,
        totals: models.prepayEmiInflow.totals,
      };
    }
    if (scenarioView === "CASHFLOW_NO_PF" && models.cashflowNoPf) {
      return { rows: models.cashflowNoPf.rows, totals: models.cashflowNoPf.totals };
    }
    if (scenarioView === "CASHFLOW_PLUS_PF" && models.cashflowPlusPf) {
      if (isCashflowResult(models.cashflowPlusPf)) {
        return {
          rows: models.cashflowPlusPf.rows,
          totals: models.cashflowPlusPf.totals,
          cashBalances: models.cashflowPlusPf.rows.map((r) => r.cash_balance_inr),
          warnings: models.cashflowPlusPf.warnings,
        };
      }
      return { rows: models.cashflowPlusPf.rows, totals: models.cashflowPlusPf.totals };
    }
    if (scenarioView === "UE_PF_TO_LOAN" && models.uePfToLoan) {
      if (isCashflowResult(models.uePfToLoan)) {
        return {
          rows: models.uePfToLoan.rows,
          totals: models.uePfToLoan.totals,
          cashBalances: models.uePfToLoan.rows.map((r) => r.cash_balance_inr),
          warnings: models.uePfToLoan.warnings,
        };
      }
      return { rows: models.uePfToLoan.rows, totals: models.uePfToLoan.totals };
    }
    if (scenarioView === "UE_PF_BRIDGE" && models.uePfBridge) {
      return {
        rows: models.uePfBridge.rows,
        totals: models.uePfBridge.totals,
        cashBalances: models.uePfBridge.rows.map((r) => r.cash_balance_inr),
        warnings: models.uePfBridge.warnings,
      };
    }
    if (scenarioView === "UE_DELAY_PREPAY" && models.ueDelayPrepay) {
      return {
        rows: models.ueDelayPrepay.rows,
        totals: models.ueDelayPrepay.totals,
        cashBalances: models.ueDelayPrepay.rows.map((r) => r.cash_balance_inr),
        warnings: models.ueDelayPrepay.warnings,
      };
    }
    if (scenarioView === "STAGED_PREPAY" && models.stagedPrepay) {
      return { rows: models.stagedPrepay.rows, totals: models.stagedPrepay.totals };
    }
    return { rows: models.base.rows, totals: models.base.totals };
  }, [models, scenarioView]);

  const activeRows = activeBundle?.rows ?? [];
  const activeCashBalances = activeBundle?.cashBalances;
  const activeWarnings = activeBundle?.warnings ?? [];
  const principalCurve = useMemo(
    () => buildPrincipalCurve(activeRows),
    [activeRows],
  );
  const interestCurve = useMemo(
    () => buildCumulativeInterestCurve(activeRows),
    [activeRows],
  );

  function setField<K extends keyof LoanInput>(key: K, value: string) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function setBoolField(
    key: "gold_haircut_enabled" | "unemployment_mode" | "pmi_active",
    checked: boolean,
  ) {
    setInputs((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
  }

  function loadReference() {
    const ref = referenceScenarioForLocale(locale);
    setInputs(loanFormFromScenario(ref) as Record<keyof LoanInput, string>);
    setScenarioView("BASE");
    setStagedPrepays([]);
  }

  const prevLocaleRef = useRef<Locale | null>(null);
  useEffect(() => {
    if (prevLocaleRef.current === null) {
      prevLocaleRef.current = locale;
      return;
    }
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    setInputs(loanFormFromScenario(referenceScenarioForLocale(locale)) as Record<
      keyof LoanInput,
      string
    >);
    setScenarioView("BASE");
    setStagedPrepays([]);
  }, [locale]);

  function addStagedPrepay() {
    setStagedPrepays((prev) => [...prev, newStagedPrepayEntry()]);
  }

  function removeStagedPrepay(id: string) {
    setStagedPrepays((prev) => prev.filter((e) => e.id !== id));
  }

  function updateStagedPrepay(
    id: string,
    field: "month" | "amount_inr",
    value: string,
  ) {
    setStagedPrepays((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  }

  function exportScheduleCsv() {
    if (!models || !activeBundle) return;
    const csv = scheduleToCsv(activeRows, {
      includeCashBalance: activeCashBalances !== undefined,
      cashBalances: activeCashBalances,
      startDateIso: models.v.start_date,
    });
    const slug = SCENARIO_LABELS[scenarioView].toLowerCase();
    downloadTextFile(`loan-schedule-${slug}.csv`, csv, "text/csv;charset=utf-8");
  }

  function exportScenarioJson() {
    if (!models || !activeBundle) return;
    const comp = comparisonRows.find((r) => r.id === scenarioView);
    const payload: ScenarioExportPayload = {
      exported_at: new Date().toISOString(),
      scenario_id: SCENARIO_LABELS[scenarioView],
      scenario_label: comp?.label ?? SCENARIO_LABELS[scenarioView],
      inputs: { ...models.v, prepay_source: prepaySource, staged_prepayments: stagedEvents },
      totals: {
        payoff_month: activeBundle.totals.payoff_month,
        total_interest_inr: activeBundle.totals.total_interest_inr,
        total_paid_inr: activeBundle.totals.total_paid_inr,
        total_prepayments_inr: activeBundle.totals.total_prepayments_inr,
        interest_delta_vs_base_inr: comp?.deltaInterestVsBase,
        min_cash_balance_inr: comp?.minCashBalance,
      },
      staged_prepayments: stagedEvents.length > 0 ? stagedEvents : undefined,
    };
    const slug = SCENARIO_LABELS[scenarioView].toLowerCase();
    downloadTextFile(
      `loan-scenario-${slug}.json`,
      scenarioToJson(payload),
      "application/json;charset=utf-8",
    );
  }

  return {
    inputs,
    setField,
    setBoolField,
    loadReference,
    parsed,
    locale,
    models,
    comparisonRows,
    withdrawalPlan,
    activeRows,
    activeCashBalances,
    activeWarnings,
    principalCurve,
    interestCurve,
    scenarioView,
    setScenarioView,
    prepaySource,
    setPrepaySource,
    effectiveLiquidInr,
    stagedPrepays,
    addStagedPrepay,
    removeStagedPrepay,
    updateStagedPrepay,
    exportScheduleCsv,
    exportScenarioJson,
  };
}
