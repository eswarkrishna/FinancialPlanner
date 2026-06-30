import { z } from "zod";
import { DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT } from "../pf/constants";

/** Spec §4.1–4.2 — parse form strings to numbers where needed */
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
  /** Unemployment + cashflow module (§4.7–4.8). */
  unemployment_mode: z.coerce.boolean().optional().default(false),
  unemployment_start_month: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1),
  monthly_living_expense_inr: z.coerce.number().min(0).optional().default(0),
  monthly_income_inr: z.coerce.number().min(0).optional().default(0),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

export const REFERENCE_SCENARIO: LoanInput = {
  principal_inr: 5_000_000,
  annual_interest_rate: 7.9,
  tenure_months: 168,
  start_date: undefined,
  cash_inr: 2_500_000,
  monthly_salary_inr: 100_000,
  pf_corpus_inr: 2_500_000,
  pf_annual_interest_rate_pct: DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT,
  monthly_pf_addition_inr: 0,
  gold_liquid_inr: 2_500_000,
  gold_haircut_enabled: false,
  gold_haircut_pct: 0,
  monthly_cash_to_loan_inr: 0,
  unemployment_mode: false,
  unemployment_start_month: 1,
  monthly_living_expense_inr: 0,
  monthly_income_inr: 0,
};

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
