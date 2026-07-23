import { z } from "zod";
import type { Locale } from "../locale/types";

const retirementImportSchema = z.object({
  locale: z.enum(["IN", "US", "UK"]).optional(),
  inputs: z.object({
    current_corpus_inr: z.coerce.number().min(0),
    monthly_contribution_inr: z.coerce.number().min(0),
    annual_return_pct: z.coerce.number().min(0),
    inflation_pct: z.coerce.number().min(0),
    years_to_retirement: z.coerce.number().int().positive(),
    annual_expense_today_inr: z.coerce.number().min(0),
    safe_withdrawal_rate_pct: z.coerce.number().min(0).optional(),
    expected_social_security_monthly_inr: z.coerce.number().min(0).optional(),
  }),
  selected_scenario_id: z.string().optional(),
  drawdown: z
    .object({
      depletion_year: z.number().int().positive().nullable(),
      lasts_indefinitely: z.boolean(),
    })
    .optional(),
});

export type RetirementImportFormState = {
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
  expected_social_security_monthly_inr: string;
  monthly_withdrawal_inr: string;
  post_retirement_return_pct: string;
  selectedRetirementScenario: string;
};

export type RetirementImportOutcome =
  | ({ success: true } & RetirementImportFormState)
  | { success: false; message: string };

export function parseRetirementImportJson(
  json: string,
  activeLocale?: Locale,
): RetirementImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, message: "Invalid JSON file." };
  }

  const envelope = retirementImportSchema.safeParse(parsed);
  if (!envelope.success) {
    return {
      success: false,
      message: "File is not a recognised retirement planner export.",
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
    current_corpus_inr: String(i.current_corpus_inr),
    monthly_contribution_inr: String(i.monthly_contribution_inr),
    annual_return_pct: String(i.annual_return_pct),
    inflation_pct: String(i.inflation_pct),
    years_to_retirement: String(i.years_to_retirement),
    annual_expense_today_inr: String(i.annual_expense_today_inr),
    safe_withdrawal_rate_pct: String(i.safe_withdrawal_rate_pct ?? ""),
    expected_social_security_monthly_inr: String(
      i.expected_social_security_monthly_inr ?? "",
    ),
    monthly_withdrawal_inr: "",
    post_retirement_return_pct: "",
    selectedRetirementScenario: envelope.data.selected_scenario_id ?? "base",
  };
}
