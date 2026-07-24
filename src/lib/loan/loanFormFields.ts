import type { LoanInput } from "../schemas/index";

export const EMPTY_LOAN_FORM: Record<keyof LoanInput, string> = {
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
  prepayment_fee_type: "none",
  prepayment_fee_inr: "",
  prepayment_fee_pct: "",
  rate_type: "fixed",
  emi_basis: "baseline",
  current_emi_inr: "",
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
  isa_balance_inr: "",
  gia_balance_inr: "",
  gia_cost_basis_inr: "",
  overpayment_allowance_pct: "10",
  erc_pct: "0",
  employee_pension_pct: "5",
  employer_pension_pct: "3",
  redundancy_payment_inr: "",
  marginal_tax_rate_pct: "20",
  jsa_duration_months: "6",
  smi_enabled: "false",
  smi_wait_months: "3",
  smi_rate_pct: "3.66",
  smi_capital_cap_inr: "200000",
  cgt_rate_pct: "24",
  cgt_annual_exempt_inr: "3000",
  rule_of_55_eligible: "false",
  separation_age: "55",
  secure2_emergency_1k: "false",
  vesting_schedule: "immediate",
  years_of_service: "0",
  k401_loan_balance_inr: "",
};

function stringField(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function boolField(value: unknown, fallback: boolean): string {
  if (value === true || value === "true") return "true";
  if (value === false || value === "false") return "false";
  return fallback ? "true" : "false";
}

/** Map parsed or exported loan inputs to string form fields for controlled inputs. */
export function loanInputToFormFields(
  input: Partial<Record<keyof LoanInput, unknown>>,
): Record<keyof LoanInput, string> {
  return {
    principal_inr: stringField(input.principal_inr),
    annual_interest_rate: stringField(input.annual_interest_rate),
    tenure_months: stringField(input.tenure_months),
    start_date: stringField(input.start_date),
    cash_inr: stringField(input.cash_inr),
    monthly_salary_inr: stringField(input.monthly_salary_inr),
    annual_salary_inr: stringField(input.annual_salary_inr),
    pf_corpus_inr: stringField(input.pf_corpus_inr),
    pf_annual_interest_rate_pct: stringField(input.pf_annual_interest_rate_pct),
    monthly_pf_addition_inr: stringField(input.monthly_pf_addition_inr),
    gold_liquid_inr: stringField(input.gold_liquid_inr),
    gold_haircut_enabled: boolField(input.gold_haircut_enabled, false),
    gold_haircut_pct: stringField(input.gold_haircut_pct),
    monthly_cash_to_loan_inr: stringField(input.monthly_cash_to_loan_inr),
    prepayment_fee_type:
      input.prepayment_fee_type === "flat" || input.prepayment_fee_type === "percent"
        ? input.prepayment_fee_type
        : "none",
    prepayment_fee_inr: stringField(input.prepayment_fee_inr),
    prepayment_fee_pct: stringField(input.prepayment_fee_pct),
    rate_type: input.rate_type === "floating" ? "floating" : "fixed",
    emi_basis: input.emi_basis === "current" ? "current" : "baseline",
    current_emi_inr: stringField(input.current_emi_inr),
    unemployment_mode: boolField(input.unemployment_mode, false),

    unemployment_start_month: stringField(input.unemployment_start_month, "1"),
    monthly_living_expense_inr: stringField(input.monthly_living_expense_inr),
    monthly_income_inr: stringField(input.monthly_income_inr),
    monthly_uib_inr: stringField(input.monthly_uib_inr),
    vested_fraction_pct: stringField(input.vested_fraction_pct, "100"),
    early_withdrawal_tax_withholding_pct: stringField(
      input.early_withdrawal_tax_withholding_pct,
      "22",
    ),
    employer_match_rate_pct: stringField(input.employer_match_rate_pct, "50"),
    employer_match_cap_pct_of_salary: stringField(
      input.employer_match_cap_pct_of_salary,
      "6",
    ),
    employment_type:
      input.employment_type === "self_employed" ? "self_employed" : "w2",
    pmi_monthly_inr: stringField(input.pmi_monthly_inr),
    pmi_active: boolField(input.pmi_active, true),
    hsa_balance_inr: stringField(input.hsa_balance_inr),
    monthly_health_premium_inr: stringField(input.monthly_health_premium_inr),
    isa_balance_inr: stringField(input.isa_balance_inr),
    gia_balance_inr: stringField(input.gia_balance_inr),
    gia_cost_basis_inr: stringField(input.gia_cost_basis_inr),
    overpayment_allowance_pct: stringField(input.overpayment_allowance_pct, "10"),
    erc_pct: stringField(input.erc_pct, "0"),
    employee_pension_pct: stringField(input.employee_pension_pct, "5"),
    employer_pension_pct: stringField(input.employer_pension_pct, "3"),
    redundancy_payment_inr: stringField(input.redundancy_payment_inr),
    marginal_tax_rate_pct: stringField(input.marginal_tax_rate_pct, "20"),
    jsa_duration_months: stringField(input.jsa_duration_months, "6"),
    smi_enabled: boolField(input.smi_enabled, false),
    smi_wait_months: stringField(input.smi_wait_months, "3"),
    smi_rate_pct: stringField(input.smi_rate_pct, "3.66"),
    smi_capital_cap_inr: stringField(input.smi_capital_cap_inr, "200000"),
    cgt_rate_pct: stringField(input.cgt_rate_pct, "24"),
    cgt_annual_exempt_inr: stringField(input.cgt_annual_exempt_inr, "3000"),
    rule_of_55_eligible: boolField(input.rule_of_55_eligible, false),
    separation_age: stringField(input.separation_age, "55"),
    secure2_emergency_1k: boolField(input.secure2_emergency_1k, false),
    vesting_schedule:
      input.vesting_schedule === "cliff_3" || input.vesting_schedule === "graded_6"
        ? input.vesting_schedule
        : "immediate",
    years_of_service: stringField(input.years_of_service, "0"),
    k401_loan_balance_inr: stringField(input.k401_loan_balance_inr),
  };
}
