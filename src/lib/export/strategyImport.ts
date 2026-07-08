import { z } from "zod";
import type { Locale } from "../locale/types";

const strategyImportSchema = z.object({
  locale: z.enum(["IN", "US", "UK"]).optional(),
  inputs: z.record(z.unknown()),
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

function strField(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  if (v === undefined || v === null) return "";
  return String(v);
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
  const principal = Number(i.principal_inr);
  const rate = Number(i.annual_interest_rate);
  const tenure = Number(i.tenure_months);
  const horizon = Number(i.horizon_months);
  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(rate) ||
    !Number.isFinite(tenure) ||
    tenure <= 0 ||
    !Number.isFinite(horizon) ||
    horizon <= 0
  ) {
    return { success: false, message: "Strategy inputs failed validation." };
  }

  return {
    success: true,
    form: {
      principal_inr: strField(i, "principal_inr"),
      annual_interest_rate: strField(i, "annual_interest_rate"),
      tenure_months: strField(i, "tenure_months"),
      cash_inr: strField(i, "cash_inr"),
      pf_corpus_inr: strField(i, "pf_corpus_inr"),
      pf_annual_interest_rate_pct: strField(i, "pf_annual_interest_rate_pct"),
      monthly_pf_addition_inr: strField(i, "monthly_pf_addition_inr"),
      monthly_take_home_inr: strField(i, "monthly_take_home_inr"),
      monthly_living_expense_inr: strField(i, "monthly_living_expense_inr"),
      extra_monthly_income_inr: strField(i, "extra_monthly_income_inr"),
      emergency_months_buffer: strField(i, "emergency_months_buffer"),
      expected_equity_return_pct: strField(i, "expected_equity_return_pct"),
      horizon_months: strField(i, "horizon_months"),
      repayment_pct_of_take_home: strField(i, "repayment_pct_of_take_home"),
      extra_income_post_tax:
        typeof i.extra_income_post_tax === "boolean" ? i.extra_income_post_tax : null,
      marginal_tax_rate_pct: strField(i, "marginal_tax_rate_pct"),
    },
  };
}
