import type { Locale } from "../locale/types";

export const RETIREMENT_FORM_STORAGE_KEY = "financial-planner-retirement-form";
export const RETIREMENT_FORM_STORAGE_VERSION = 1;

export interface RetirementFormPersistedState {
  version: typeof RETIREMENT_FORM_STORAGE_VERSION;
  locale: Locale;
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
  expected_social_security_monthly_inr: string;
  selected_scenario_id: string;
  monthly_withdrawal_inr?: string;
  post_retirement_return_pct?: string;
}

export function retirementFormStorageKey(locale: Locale): string {
  return `${RETIREMENT_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(
  value: Partial<RetirementFormPersistedState>,
): value is RetirementFormPersistedState {
  return (
    value.version === RETIREMENT_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.current_corpus_inr === "string" &&
    typeof value.selected_scenario_id === "string"
  );
}

export function readRetirementFormState(
  locale: Locale,
): RetirementFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(retirementFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RetirementFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeRetirementFormState(state: RetirementFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(
      retirementFormStorageKey(state.locale),
      JSON.stringify(state),
    );
  } catch {
    // ignore
  }
}

export function clearRetirementFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(retirementFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(retirementFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
