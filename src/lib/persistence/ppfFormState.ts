import type { Locale } from "../locale/types";

export const PPF_FORM_STORAGE_KEY = "financial-planner-ppf-form";
export const PPF_FORM_STORAGE_VERSION = 1;

export interface PpfFormPersistedState {
  version: typeof PPF_FORM_STORAGE_VERSION;
  locale: Locale;
  opening_balance_inr: string;
  annual_contribution_inr: string;
  interest_rate_pct: string;
  years: string;
}

export function ppfFormStorageKey(locale: Locale): string {
  return `${PPF_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<PpfFormPersistedState>): value is PpfFormPersistedState {
  return (
    value.version === PPF_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.opening_balance_inr === "string" &&
    typeof value.annual_contribution_inr === "string" &&
    typeof value.interest_rate_pct === "string" &&
    typeof value.years === "string"
  );
}

export function readPpfFormState(locale: Locale): PpfFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ppfFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PpfFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writePpfFormState(state: PpfFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(ppfFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearPpfFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(ppfFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(ppfFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
