import { z } from "zod";
import type { Locale } from "../locale/types";
import type { DebtStrategy } from "../debt";
import type { DebtFormRowPersisted } from "../persistence/debtFormState";

const debtRowSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  balance_inr: z.coerce.number().min(0),
  apr_pct: z.coerce.number().min(0),
  minimum_payment_inr: z.coerce.number().min(0),
});

const debtImportSchema = z.object({
  locale: z.enum(["IN", "US", "UK"]).optional(),
  start_date: z.string(),
  monthly_budget_inr: z.coerce.number().min(0),
  debts: z.array(debtRowSchema).min(1),
  active_strategy: z.enum(["avalanche", "snowball"]).optional(),
});

export type DebtImportResult = {
  startDateIso: string;
  monthlyBudgetInr: string;
  selectedDebtStrategy: DebtStrategy;
  debtRows: DebtFormRowPersisted[];
};

export type DebtImportOutcome =
  | ({ success: true } & DebtImportResult)
  | { success: false; message: string };

export function parseDebtImportJson(
  json: string,
  activeLocale?: Locale,
): DebtImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, message: "Invalid JSON file." };
  }

  const envelope = debtImportSchema.safeParse(parsed);
  if (!envelope.success) {
    return { success: false, message: "File is not a recognised debt planner export." };
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

  return {
    success: true,
    startDateIso: envelope.data.start_date,
    monthlyBudgetInr: String(envelope.data.monthly_budget_inr),
    selectedDebtStrategy: envelope.data.active_strategy ?? "avalanche",
    debtRows: envelope.data.debts.map((d) => ({
      id: d.id,
      name: d.name,
      balance_inr: String(d.balance_inr),
      apr_pct: String(d.apr_pct),
      minimum_payment_inr: String(d.minimum_payment_inr),
    })),
  };
}
