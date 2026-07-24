import {
  effectiveBrokerageLiquidUsd,
  effectiveGoldLiquidInr,
} from "../../../lib/loan";
import type { Locale } from "../../../lib/locale/types";
import { loanInputSchema, type LoanInput } from "../../../lib/schemas/index";

/**
 * Parse raw loan form strings into a validated `LoanInput` with the shared
 * defaulting rules. Single source of truth for the live form (useLoanModels)
 * and saved scenario slots (§4.9.1).
 */
export function parseLoanForm(inputs: Record<keyof LoanInput, string>) {
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
    prepayment_fee_type:
      inputs.prepayment_fee_type === "flat" ||
      inputs.prepayment_fee_type === "percent"
        ? inputs.prepayment_fee_type
        : "none",
    prepayment_fee_inr: inputs.prepayment_fee_inr || 0,
    prepayment_fee_pct: inputs.prepayment_fee_pct || 0,
    rate_type: inputs.rate_type === "floating" ? "floating" : "fixed",
    emi_basis: inputs.emi_basis === "current" ? "current" : "baseline",
    current_emi_inr: inputs.current_emi_inr || 0,
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
    isa_balance_inr: inputs.isa_balance_inr || 0,
    gia_balance_inr: inputs.gia_balance_inr || 0,
    gia_cost_basis_inr: inputs.gia_cost_basis_inr || 0,
    overpayment_allowance_pct: inputs.overpayment_allowance_pct || 10,
    erc_pct: inputs.erc_pct || 0,
    employee_pension_pct: inputs.employee_pension_pct || 5,
    employer_pension_pct: inputs.employer_pension_pct || 3,
    redundancy_payment_inr: inputs.redundancy_payment_inr || 0,
    marginal_tax_rate_pct: inputs.marginal_tax_rate_pct || 20,
    jsa_duration_months: inputs.jsa_duration_months || 6,
    smi_enabled: inputs.smi_enabled === "true",
    smi_wait_months: inputs.smi_wait_months || 3,
    smi_rate_pct: inputs.smi_rate_pct || 3.66,
    smi_capital_cap_inr: inputs.smi_capital_cap_inr || 200_000,
    cgt_rate_pct: inputs.cgt_rate_pct || 24,
    cgt_annual_exempt_inr: inputs.cgt_annual_exempt_inr || 3_000,
  });
}

/** Locale-dependent liquid balance available for one-time prepay. */
export function effectiveLiquidForLocale(v: LoanInput, locale: Locale): number {
  if (locale === "UK") {
    return v.isa_balance_inr + v.gia_balance_inr;
  }
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
}
