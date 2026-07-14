import { z } from "zod";
import { DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT } from "../pf/constants";
import {
  DEFAULT_EARLY_WITHDRAWAL_TAX_WITHHOLDING_PCT,
  DEFAULT_EMPLOYER_MATCH_CAP_PCT,
  DEFAULT_EMPLOYER_MATCH_RATE_PCT,
} from "../k401/constants";
import { REFERENCE_SCENARIO_IN } from "../locale/constants";

/** Spec §4.1–4.2 / SPEC-US §4.2 — parse form strings to numbers where needed */
export const loanInputSchema = z.object({
  principal_inr: z.coerce.number().positive("Principal must be positive"),
  annual_interest_rate: z.coerce
    .number()
    .min(0, "Rate cannot be negative")
    .max(50, "Rate unrealistically high"),
  tenure_months: z.coerce
    .number()
    .int("Tenure must be a whole number of months")
    .positive("Tenure must be positive")
    .max(600, "Tenure capped at 600 months for UI"),
  /** Optional calendar anchor for schedule export (§4.1). */
  start_date: z
    .string()
    .optional()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), "Invalid start date"),
  cash_inr: z.coerce.number().min(0).optional().default(0),
  monthly_salary_inr: z.coerce.number().min(0).optional().default(0),
  /** US: annual salary for employer match; IN: optional. */
  annual_salary_inr: z.coerce.number().min(0).optional().default(0),
  pf_corpus_inr: z.coerce.number().min(0).optional().default(0),
  pf_annual_interest_rate_pct: z.coerce.number().min(0).max(50).optional().default(
    DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT,
  ),
  monthly_pf_addition_inr: z.coerce.number().min(0).optional().default(0),
  gold_liquid_inr: z.coerce.number().min(0).optional().default(0),
  gold_haircut_enabled: z.coerce.boolean().optional().default(false),
  gold_haircut_pct: z.coerce
    .number()
    .min(0, "Haircut cannot be negative")
    .max(100, "Haircut cannot exceed 100%")
    .optional()
    .default(0),
  /** Recurring amount applied as extra principal after each month's EMI (§4.5). */
  monthly_cash_to_loan_inr: z.coerce.number().min(0).optional().default(0),
  /** Loan-tab prepayment / foreclosure fee (§4.4.1). */
  prepayment_fee_type: z
    .enum(["none", "flat", "percent"])
    .optional()
    .default("none"),
  prepayment_fee_inr: z.coerce.number().min(0).optional().default(0),
  prepayment_fee_pct: z.coerce.number().min(0).max(100).optional().default(0),

  /** Unemployment / job-loss + cashflow module (§4.7–4.8 / SPEC-US §4.7–4.8). */
  unemployment_mode: z.coerce.boolean().optional().default(false),
  unemployment_start_month: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1),
  monthly_living_expense_inr: z.coerce.number().min(0).optional().default(0),
  monthly_income_inr: z.coerce.number().min(0).optional().default(0),
  /** US: unemployment insurance benefit (SPEC-US §4.8). */
  monthly_uib_inr: z.coerce.number().min(0).optional().default(0),
  vested_fraction_pct: z.coerce.number().min(0).max(100).optional().default(100),
  early_withdrawal_tax_withholding_pct: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .default(DEFAULT_EARLY_WITHDRAWAL_TAX_WITHHOLDING_PCT),
  employer_match_rate_pct: z.coerce
    .number()
    .min(0)
    .max(200)
    .optional()
    .default(DEFAULT_EMPLOYER_MATCH_RATE_PCT),
  employer_match_cap_pct_of_salary: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .default(DEFAULT_EMPLOYER_MATCH_CAP_PCT),
  /** US §3 / SPEC-US §4.2 — W-2 vs self-employed preset. */
  employment_type: z.enum(["w2", "self_employed"]).optional().default("w2"),
  /** US §4.1 — flat PMI added to job-loss cashflow (stored in locale-neutral field). */
  pmi_monthly_inr: z.coerce.number().min(0).optional().default(0),
  pmi_active: z.coerce.boolean().optional().default(true),
  /** US §4.2 / §4.8 — HSA premium bridge during job loss. */
  hsa_balance_inr: z.coerce.number().min(0).optional().default(0),
  monthly_health_premium_inr: z.coerce.number().min(0).optional().default(0),
  /** UK §4.2 — ISA / GIA liquid sleeves. */
  isa_balance_inr: z.coerce.number().min(0).optional().default(0),
  gia_balance_inr: z.coerce.number().min(0).optional().default(0),
  gia_cost_basis_inr: z.coerce.number().min(0).optional().default(0),
  /** UK §4.1 — ERC on excess overpayment allowance. */
  overpayment_allowance_pct: z.coerce.number().min(0).max(100).optional().default(10),
  erc_pct: z.coerce.number().min(0).max(100).optional().default(0),
  employee_pension_pct: z.coerce.number().min(0).max(100).optional().default(5),
  employer_pension_pct: z.coerce.number().min(0).max(100).optional().default(3),
  /** UK §4.7 — redundancy + JSA + SMI job-loss bridge. */
  redundancy_payment_inr: z.coerce.number().min(0).optional().default(0),
  marginal_tax_rate_pct: z.coerce.number().min(0).max(100).optional().default(20),
  jsa_duration_months: z.coerce.number().int().min(0).max(24).optional().default(6),
  smi_enabled: z.coerce.boolean().optional().default(false),
  smi_wait_months: z.coerce.number().int().min(0).max(24).optional().default(3),
  smi_rate_pct: z.coerce.number().min(0).max(20).optional().default(3.66),
  smi_capital_cap_inr: z.coerce.number().min(0).optional().default(200_000),
  /** UK §7.5 / §4.12 — GIA CGT on liquidation. */
  cgt_rate_pct: z.coerce.number().min(0).max(100).optional().default(24),
  cgt_annual_exempt_inr: z.coerce.number().min(0).optional().default(3_000),
  /** US v1.1 — Rule of 55: zero early-withdrawal penalty in job-loss module. */
  rule_of_55_eligible: z.coerce.boolean().optional().default(false),
  separation_age: z.coerce.number().int().min(18).max(80).optional().default(55),
  /** US v1.1 — SECURE 2.0 up to $1k/yr penalty-free emergency (income tax still applies). */
  secure2_emergency_1k: z.coerce.boolean().optional().default(false),
  /** US v1.1 — vesting schedule for employer match portion. */
  vesting_schedule: z
    .enum(["immediate", "cliff_3", "graded_6"])
    .optional()
    .default("immediate"),
  years_of_service: z.coerce.number().min(0).max(50).optional().default(0),
  /** US v1.2 — outstanding 401(k) loan balance available for prepay modelling. */
  k401_loan_balance_inr: z.coerce.number().min(0).optional().default(0),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

/** @deprecated Use REFERENCE_SCENARIO_IN from locale/constants */
export const REFERENCE_SCENARIO: LoanInput = REFERENCE_SCENARIO_IN;

/** Spec §4.2 (extended fields) + §4.12 — household + strategy planner inputs. */
export const strategyInputSchema = z.object({
  monthly_take_home_inr: z.coerce.number().min(0).optional().default(0),
  monthly_living_expense_inr: z.coerce.number().min(0).optional().default(0),
  extra_monthly_income_inr: z.coerce.number().min(0).optional().default(0),
  extra_income_post_tax: z.coerce.boolean().optional().default(true),
  marginal_tax_rate_pct: z.coerce.number().min(0).max(100).optional().default(0),
  emergency_months_buffer: z.coerce
    .number()
    .int("Buffer must be a whole number of months")
    .min(0)
    .max(60)
    .optional()
    .default(6),
  expected_equity_return_pct: z.coerce
    .number()
    .min(0)
    .max(50)
    .optional()
    .default(11),
  horizon_months: z.coerce
    .number()
    .int("Horizon must be a whole number of months")
    .positive("Horizon must be positive")
    .max(600)
    .optional()
    .default(168),
  repayment_pct_of_take_home: z.coerce.number().min(0).max(100).optional().default(0),
  tax_regime: z.enum(["old", "new"]).optional().default("new"),
});

export type StrategyHouseholdInput = z.infer<typeof strategyInputSchema>;
