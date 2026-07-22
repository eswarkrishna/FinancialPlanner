import type { Locale } from "../locale/types";

export const SSY_FORM_STORAGE_KEY = "financial-planner-ssy-form";
export const SSY_FORM_STORAGE_VERSION = 1;

export interface SsyFormPersistedState {
  version: typeof SSY_FORM_STORAGE_VERSION;
  locale: Locale;
  annual_contribution_inr: string;
  girl_age_years: string;
  interest_rate_pct: string;
}

export function ssyFormStorageKey(locale: Locale): string {
  return `${SSY_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<SsyFormPersistedState>): value is SsyFormPersistedState {
  return (
    value.version === SSY_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.annual_contribution_inr === "string" &&
    typeof value.girl_age_years === "string" &&
    typeof value.interest_rate_pct === "string"
  );
}

export function readSsyFormState(locale: Locale): SsyFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ssyFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SsyFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSsyFormState(state: SsyFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(ssyFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearSsyFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(ssyFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(ssyFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
