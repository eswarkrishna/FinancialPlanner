import type { Locale } from "../locale/types";
import type { DebtStrategy } from "../debt";

export const DEBT_FORM_STORAGE_KEY = "financial-planner-debt-form";
export const DEBT_FORM_STORAGE_VERSION = 1;

export interface DebtFormRowPersisted {
  id: string;
  name: string;
  balance_inr: string;
  apr_pct: string;
  minimum_payment_inr: string;
}

export interface DebtFormPersistedState {
  version: typeof DEBT_FORM_STORAGE_VERSION;
  locale: Locale;
  start_date: string;
  monthly_budget_inr: string;
  selected_strategy: DebtStrategy;
  debts: DebtFormRowPersisted[];
}

export function debtFormStorageKey(locale: Locale): string {
  return `${DEBT_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<DebtFormPersistedState>): value is DebtFormPersistedState {
  return (
    value.version === DEBT_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.start_date === "string" &&
    typeof value.monthly_budget_inr === "string" &&
    (value.selected_strategy === "avalanche" || value.selected_strategy === "snowball") &&
    Array.isArray(value.debts)
  );
}

export function readDebtFormState(locale: Locale): DebtFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(debtFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DebtFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDebtFormState(state: DebtFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(debtFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearDebtFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(debtFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(debtFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
