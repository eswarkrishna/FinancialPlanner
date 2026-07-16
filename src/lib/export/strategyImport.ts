import { z } from "zod";
import type { Locale } from "../locale/types";
import { DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT } from "../pf/constants";

const strategyInputsImportSchema = z.object({
  principal_inr: z.coerce.number().positive(),
  annual_interest_rate: z.coerce.number().min(0).max(50),
  tenure_months: z.coerce.number().int().positive().max(600),
  cash_inr: z.coerce.number().min(0).optional().default(0),
  pf_corpus_inr: z.coerce.number().min(0).optional().default(0),
  pf_annual_interest_rate_pct: z.coerce
    .number()
    .min(0)
    .max(50)
    .optional()
    .default(DEFAULT_PF_ANNUAL_INTEREST_RATE_PCT),
  monthly_pf_addition_inr: z.coerce.number().min(0).optional().default(0),
  monthly_take_home_inr: z.coerce.number().min(0).optional().default(0),
  monthly_living_expense_inr: z.coerce.number().min(0).optional().default(0),
  extra_monthly_income_inr: z.coerce.number().min(0).optional().default(0),
  emergency_months_buffer: z.coerce.number().min(0).optional().default(0),
  expected_equity_return_pct: z.coerce.number().min(0).max(100).optional().default(12),
  horizon_months: z.coerce.number().int().positive().max(600),
  repayment_pct_of_take_home: z.coerce.number().min(0).max(100).optional(),
  extra_income_post_tax: z.coerce.boolean().optional().default(false),
  marginal_tax_rate_pct: z.coerce.number().min(0).max(100).optional().default(0),
});

const strategyImportSchema = z.object({
  locale: z.enum(["IN", "US", "UK"]).optional(),
  inputs: strategyInputsImportSchema,
});

export type StrategyImportFormState = {
  principal_inr: string;
  annual_interest_rate: string;
  tenure_months: string;
  cash_inr: string;
  pf_corpus_inr: string;
  pf_annual_interest_rate_pct: string;
  monthly_pf_addition_inr: string;
  monthly_take_home_inr: string;
  monthly_living_expense_inr: string;
  extra_monthly_income_inr: string;
  emergency_months_buffer: string;
  expected_equity_return_pct: string;
  horizon_months: string;
  repayment_pct_of_take_home: string;
  extra_income_post_tax: boolean | null;
  marginal_tax_rate_pct: string;
};

export type StrategyImportOutcome =
  | ({ success: true; form: StrategyImportFormState })
  | { success: false; message: string };

function toFormField(value: number): string {
  return String(value);
}

export function parseStrategyImportJson(
  json: string,
  activeLocale?: Locale,
): StrategyImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, message: "Invalid JSON file." };
  }

  const envelope = strategyImportSchema.safeParse(parsed);
  if (!envelope.success) {
    return {
      success: false,
      message: "File is not a recognised strategy planner export.",
    };
  }

  if (
    envelope.data.locale !== undefined &&
    activeLocale !== undefined &&
    envelope.data.locale !== activeLocale
  ) {
    return {
      success: false,
      message: `This export is for the ${envelope.data.locale} locale; switch locale before importing.`,
    };
  }

  const i = envelope.data.inputs;
  return {
    success: true,
    form: {
      principal_inr: toFormField(i.principal_inr),
      annual_interest_rate: toFormField(i.annual_interest_rate),
      tenure_months: toFormField(i.tenure_months),
      cash_inr: toFormField(i.cash_inr),
      pf_corpus_inr: toFormField(i.pf_corpus_inr),
      pf_annual_interest_rate_pct: toFormField(i.pf_annual_interest_rate_pct),
      monthly_pf_addition_inr: toFormField(i.monthly_pf_addition_inr),
      monthly_take_home_inr: toFormField(i.monthly_take_home_inr),
      monthly_living_expense_inr: toFormField(i.monthly_living_expense_inr),
      extra_monthly_income_inr: toFormField(i.extra_monthly_income_inr),
      emergency_months_buffer: toFormField(i.emergency_months_buffer),
      expected_equity_return_pct: toFormField(i.expected_equity_return_pct),
      horizon_months: toFormField(i.horizon_months),
      repayment_pct_of_take_home:
        i.repayment_pct_of_take_home === undefined
          ? ""
          : toFormField(i.repayment_pct_of_take_home),
      extra_income_post_tax: i.extra_income_post_tax,
      marginal_tax_rate_pct: toFormField(i.marginal_tax_rate_pct),
    },
  };
}
