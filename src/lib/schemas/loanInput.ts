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
  cash_inr: z.coerce.number().min(0).optional().default(0),
  monthly_salary_inr: z.coerce.number().min(0).optional().default(0),
  pf_corpus_inr: z.coerce.number().min(0).optional().default(0),
  pf_annual_interest_rate_pct: z.coerce.number().min(0).max(50).optional().default(
    DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT,
  ),
  monthly_pf_addition_inr: z.coerce.number().min(0).optional().default(0),
  gold_liquid_inr: z.coerce.number().min(0).optional().default(0),
  /** Recurring amount applied as extra principal after each month's EMI (§4.5). */
  monthly_cash_to_loan_inr: z.coerce.number().min(0).optional().default(0),
});

export type LoanInput = z.infer<typeof loanInputSchema>;

export const REFERENCE_SCENARIO: LoanInput = {
  principal_inr: 5_000_000,
  annual_interest_rate: 7.9,
  tenure_months: 168,
  cash_inr: 2_500_000,
  monthly_salary_inr: 100_000,
  pf_corpus_inr: 2_500_000,
  pf_annual_interest_rate_pct: DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT,
  monthly_pf_addition_inr: 0,
  gold_liquid_inr: 2_500_000,
  monthly_cash_to_loan_inr: 0,
};
