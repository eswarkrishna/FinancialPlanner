import type { Locale } from "../locale/types";
import type { BudgetBucket, InvestmentAssetClass } from "../budget/types";

export const BUDGET_FORM_STORAGE_KEY = "financial-planner-budget-form";
export const BUDGET_FORM_STORAGE_VERSION = 1;

export interface BudgetLinePersisted {
  id: string;
  name: string;
  amount_inr: string;
  bucket?: BudgetBucket;
}

export interface InvestmentLinePersisted {
  id: string;
  name: string;
  asset_class: InvestmentAssetClass;
  current_value_inr: string;
  monthly_contribution_inr: string;
  expected_return_pct: string;
}

export interface BudgetFormPersistedState {
  version: typeof BUDGET_FORM_STORAGE_VERSION;
  locale: Locale;
  month_label: string;
  income_lines: BudgetLinePersisted[];
  expense_lines: BudgetLinePersisted[];
  investments: InvestmentLinePersisted[];
  emergency_fund_inr: string;
  projection_months: string;
}

export function budgetFormStorageKey(locale: Locale): string {
  return `${BUDGET_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<BudgetFormPersistedState>): value is BudgetFormPersistedState {
  return (
    value.version === BUDGET_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.month_label === "string" &&
    Array.isArray(value.income_lines) &&
    Array.isArray(value.expense_lines) &&
    Array.isArray(value.investments) &&
    typeof value.emergency_fund_inr === "string" &&
    typeof value.projection_months === "string"
  );
}

export function readBudgetFormState(locale: Locale): BudgetFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(budgetFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BudgetFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBudgetFormState(state: BudgetFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(budgetFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearBudgetFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(budgetFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(budgetFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
