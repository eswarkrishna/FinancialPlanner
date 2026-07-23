import type { Locale } from "../locale/types";

export const LUMPSUM_FORM_STORAGE_KEY = "financial-planner-lumpsum-form";
export const LUMPSUM_FORM_STORAGE_VERSION = 1;

export interface LumpsumFormPersistedState {
  version: typeof LUMPSUM_FORM_STORAGE_VERSION;
  locale: Locale;
  principal_inr: string;
  expected_annual_return_pct: string;
  years: string;
}

export function lumpsumFormStorageKey(locale: Locale): string {
  return `${LUMPSUM_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<LumpsumFormPersistedState>): value is LumpsumFormPersistedState {
  return (
    value.version === LUMPSUM_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.principal_inr === "string" &&
    typeof value.expected_annual_return_pct === "string" &&
    typeof value.years === "string"
  );
}

export function readLumpsumFormState(locale: Locale): LumpsumFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(lumpsumFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LumpsumFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLumpsumFormState(state: LumpsumFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(lumpsumFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}
