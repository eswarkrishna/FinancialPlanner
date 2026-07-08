import type {
  CashflowSimResult,
  ScheduleRow,
  UkCashflowSimResult,
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
): value is CashflowSimResult | UsCashflowSimResult | UkCashflowSimResult {
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
  if (source === "isa") return "ISA";
  if (source === "gia") return "GIA";
  if (source === "pf") return locale === "US" ? "401(k)" : locale === "UK" ? "pension" : "PF";
  return locale === "US" ? "brokerage" : locale === "UK" ? "GIA" : "gold";
}

export function prepaySourceScheduleLabel(
  source: PrepaySource,
  locale: Locale = "IN",
): string {
  if (source === "cash") return "Cash";
  if (source === "isa") return "ISA";
  if (source === "gia") return "GIA";
  if (source === "pf") return locale === "US" ? "401(k)" : locale === "UK" ? "Pension" : "PF";
  return locale === "US" ? "Brokerage" : locale === "UK" ? "GIA" : "Gold";
}

export function prepaySourceHintLabel(
  source: PrepaySource,
  locale: Locale = "IN",
): string {
  if (source === "cash") return "Cash";
  if (source === "isa") return "ISA (tax-free)";
  if (source === "gia") return "GIA (taxable)";
  if (source === "pf") return locale === "US" ? "401(k) vested" : locale === "UK" ? "Pension pot (locked)" : "PF account";
  return locale === "US" ? "Brokerage (liquid)" : locale === "UK" ? "GIA (liquid)" : "Gold (liquid)";
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
  if (locale === "UK") {
    return ukRedundancyLabel(startMonth, jobLossMode);
  }
  const { tranche1Month, tranche2Month } = trancheMonthsFromStart(startMonth);
  if (locale === "US") {
    const tranches = `(50% m${tranche1Month} + 50% m${tranche2Month})`;
    return jobLossMode
      ? `Job loss: 401(k) to loan ${tranches}`
      : `401(k) tranches to loan ${tranches}`;
  }
  if (jobLossMode) {
    return inPfTrancheLabel(startMonth);
  }
  const tranches = `(75% m${tranche1Month} + 25% m${tranche2Month})`;
  return `PF tranches to loan ${tranches}`;
}

export function ukCashflowBaseInput(v: LoanInput, recurringToLoan: number) {
  return {
    principal_inr: v.principal_inr,
    annual_interest_rate: v.annual_interest_rate,
    tenure_months: v.tenure_months,
    cash_inr: v.cash_inr,
    isa_balance_inr: v.isa_balance_inr,
    gia_balance_inr: v.gia_balance_inr,
    gia_cost_basis_inr: v.gia_cost_basis_inr || v.gia_balance_inr,
    pension_pot_inr: v.pf_corpus_inr,
    monthly_income_inr: v.monthly_income_inr,
    monthly_living_expense_inr: v.monthly_living_expense_inr,
    monthly_extra_to_loan_inr: recurringToLoan,
    job_loss_enabled: v.unemployment_mode,
    job_loss_start_month: v.unemployment_start_month,
    redundancy_payment_inr: v.redundancy_payment_inr,
    marginal_tax_rate_pct: v.marginal_tax_rate_pct,
    monthly_jsa_inr: v.monthly_uib_inr,
    jsa_duration_months: v.jsa_duration_months,
    smi_enabled: v.smi_enabled,
    smi_wait_months: v.smi_wait_months,
    smi_rate_pct: v.smi_rate_pct,
    smi_capital_cap_inr: v.smi_capital_cap_inr,
    cgt_rate_pct: v.cgt_rate_pct,
    cgt_annual_exempt_inr: v.cgt_annual_exempt_inr,
    erc_config: {
      overpayment_allowance_pct: v.overpayment_allowance_pct,
      erc_pct: v.erc_pct,
    },
  };
}

export function ukRedundancyLabel(startMonth: number, jobLossMode: boolean): string {
  return jobLossMode
    ? `Job loss: redundancy to loan (month ${startMonth})`
    : `Redundancy prepay (month ${startMonth})`;
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
