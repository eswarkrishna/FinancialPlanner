/** Default UK-only loan fields for IN/US reference scenarios (schema defaults). */
export const LOAN_UK_FIELD_DEFAULTS = {
  isa_balance_inr: 0,
  gia_balance_inr: 0,
  gia_cost_basis_inr: 0,
  overpayment_allowance_pct: 10,
  erc_pct: 0,
  employee_pension_pct: 5,
  employer_pension_pct: 3,
  redundancy_payment_inr: 0,
  marginal_tax_rate_pct: 20,
  jsa_duration_months: 6,
  smi_enabled: false,
  smi_wait_months: 3,
  smi_rate_pct: 3.66,
  smi_capital_cap_inr: 200_000,
  cgt_rate_pct: 24,
  cgt_annual_exempt_inr: 3_000,
} as const;

/** US v1.1+ optional fields — spread into all locale reference scenarios. */
export const LOAN_US_V11_FIELD_DEFAULTS = {
  rule_of_55_eligible: false,
  separation_age: 55,
  secure2_emergency_1k: false,
  vesting_schedule: "immediate" as const,
  years_of_service: 0,
  k401_loan_balance_inr: 0,
} as const;

/** Loan-tab prepayment fee + rate + EMI-basis defaults (§4.4.1, §4.3.1, §4.4.3). */
export const LOAN_PREPAYMENT_FEE_DEFAULTS = {
  prepayment_fee_type: "none" as const,
  prepayment_fee_inr: 0,
  prepayment_fee_pct: 0,
  rate_type: "fixed" as const,
  emi_basis: "baseline" as const,
  current_emi_inr: 0,
} as const;
