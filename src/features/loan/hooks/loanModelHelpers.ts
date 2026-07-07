import type {
  CashflowSimResult,
  ScheduleRow,
  UsCashflowSimResult,
} from "../../../lib/loan";
import type { Locale } from "../../../lib/locale/types";
import type { LoanInput } from "../../../lib/schemas/index";
import type { PrepaySource } from "../../../lib/loan/scenarioViews";
import { computeMonthlyEmployerMatchUsd } from "../../../lib/k401/index";
import { trancheMonthsFromStart } from "../../../lib/shared/trancheMonths";
import type { ScenarioView } from "./loanModelTypes";

export type { PrepaySource };

export function isCashflowResult(
  value:
    | { rows: ScheduleRow[]; totals: { payoff_month: number; total_interest_inr: number; total_paid_inr: number } }
    | CashflowSimResult
    | UsCashflowSimResult,
): value is CashflowSimResult | UsCashflowSimResult {
  return "min_cash_balance_inr" in value;
}

export function scenarioViewIsAvailable(
  view: ScenarioView,
  models: {
    baseSalarySweep: unknown;
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
    case "BASE_SALARY_SWEEP":
      return models.baseSalarySweep != null;
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

export function monthly401kWithEmployerMatch(v: LoanInput): number {
  const match = computeMonthlyEmployerMatchUsd({
    annual_salary_usd: v.annual_salary_inr,
    monthly_401k_deferral_usd: v.monthly_pf_addition_inr,
    employer_match_rate_pct: v.employer_match_rate_pct,
    employer_match_cap_pct_of_salary: v.employer_match_cap_pct_of_salary,
    employment_type: v.employment_type,
  });
  return v.monthly_pf_addition_inr + match;
}

export function usCashflowBaseInput(v: LoanInput, recurringToLoan: number) {
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

export function pfTrancheEvents(
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

export function usPfTrancheLabel(startMonth: number): string {
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  return `JL 401(k) to loan (50% m${tranche1Month} + 50% m${tranche2Month})`;
}

export function inPfTrancheLabel(startMonth: number): string {
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  return `UE PF to loan (75% m${tranche1Month} + 25%+interest m${tranche2Month})`;
}

export function pfTrancheToLoanLabel(
  locale: Locale,
  startMonth: number,
  jobLossMode: boolean,
): string {
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  if (locale === "US") {
    const tranches = `(50% m${tranche1Month} + 50% m${tranche2Month})`;
    return jobLossMode
      ? `Job loss: 401(k) to loan ${tranches}`
      : `401(k) tranches to loan ${tranches}`;
  }
  const tranches = `(75% m${tranche1Month} + 25% m${tranche2Month})`;
  return jobLossMode
    ? `Unemployment: PF to loan ${tranches}`
    : `PF tranches to loan ${tranches}`;
}

export function cashflowBaseInput(v: LoanInput, recurringToLoan: number) {
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
