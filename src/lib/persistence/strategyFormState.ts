import type { Locale } from "../locale/types";

export const STRATEGY_FORM_STORAGE_KEY = "financial-planner-strategy-form";
export const STRATEGY_FORM_STORAGE_VERSION = 1;

export interface StrategyFormPersistedState {
  version: typeof STRATEGY_FORM_STORAGE_VERSION;
  locale: Locale;
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
}

export function strategyFormStorageKey(locale: Locale): string {
  return `${STRATEGY_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(
  value: Partial<StrategyFormPersistedState>,
): value is StrategyFormPersistedState {
  return (
    value.version === STRATEGY_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.principal_inr === "string"
  );
}

export function readStrategyFormState(locale: Locale): StrategyFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(strategyFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StrategyFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStrategyFormState(state: StrategyFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(strategyFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearStrategyFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(strategyFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(strategyFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
