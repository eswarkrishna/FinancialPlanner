import { z } from "zod";
import type { Locale } from "../locale/types";
import type {
  BudgetFormPersistedState,
  BudgetLinePersisted,
  InvestmentLinePersisted,
} from "../persistence/budgetFormState";

const incomeLineSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  amount_inr: z.coerce.number().min(0),
});

const expenseLineSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  amount_inr: z.coerce.number().min(0),
  bucket: z.enum(["need", "want", "savings"]),
});

const investmentSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  asset_class: z.enum(["equity", "debt", "gold", "cash", "other"]),
  current_value_inr: z.coerce.number().min(0),
  monthly_contribution_inr: z.coerce.number().min(0),
  expected_return_pct: z.coerce.number().min(0),
});

const budgetInputSchema = z.object({
  month_label: z.string().optional(),
  income_lines: z.array(incomeLineSchema).min(1),
  expense_lines: z.array(expenseLineSchema).min(1),
  investments: z.array(investmentSchema).optional(),
  emergency_fund_inr: z.coerce.number().min(0).optional(),
  projection_months: z.coerce.number().int().min(0).optional(),
});

const budgetImportSchema = z.object({
  locale: z.enum(["IN", "US", "UK"]).optional(),
  inputs: budgetInputSchema,
});

export type BudgetImportOutcome =
  | { success: true; form: Omit<BudgetFormPersistedState, "version" | "locale"> }
  | { success: false; message: string };

function toIncomeLine(line: z.infer<typeof incomeLineSchema>): BudgetLinePersisted {
  return {
    id: line.id,
    name: line.name,
    amount_inr: String(line.amount_inr),
  };
}

function toExpenseLine(line: z.infer<typeof expenseLineSchema>): BudgetLinePersisted {
  return {
    id: line.id,
    name: line.name,
    amount_inr: String(line.amount_inr),
    bucket: line.bucket,
  };
}

function toInvestmentLine(line: z.infer<typeof investmentSchema>): InvestmentLinePersisted {
  return {
    id: line.id,
    name: line.name,
    asset_class: line.asset_class,
    current_value_inr: String(line.current_value_inr),
    monthly_contribution_inr: String(line.monthly_contribution_inr),
    expected_return_pct: String(line.expected_return_pct),
  };
}

export function parseBudgetImportJson(
  json: string,
  activeLocale?: Locale,
): BudgetImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, message: "Invalid JSON file." };
  }

  const envelope = budgetImportSchema.safeParse(parsed);
  if (!envelope.success) {
    return { success: false, message: "File is not a recognised budget planner export." };
  }

  if (
    envelope.data.locale !== undefined &&
    activeLocale !== undefined &&
    envelope.data.locale !== activeLocale
  ) {
    return {
      success: false,
      message: `Export is for ${envelope.data.locale} locale; switch locale or edit the file.`,
    };
  }

  const inputs = envelope.data.inputs;
  return {
    success: true,
    form: {
      month_label: inputs.month_label ?? "",
      income_lines: inputs.income_lines.map(toIncomeLine),
      expense_lines: inputs.expense_lines.map(toExpenseLine),
      investments: (inputs.investments ?? []).map(toInvestmentLine),
      emergency_fund_inr: String(inputs.emergency_fund_inr ?? 0),
      projection_months: String(inputs.projection_months ?? 12),
    },
  };
}
