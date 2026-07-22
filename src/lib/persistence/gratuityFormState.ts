import type { Locale } from "../locale/types";

export const GRATUITY_FORM_STORAGE_KEY = "financial-planner-gratuity-form";
export const GRATUITY_FORM_STORAGE_VERSION = 1;

export interface GratuityFormPersistedState {
  version: typeof GRATUITY_FORM_STORAGE_VERSION;
  locale: Locale;
  last_drawn_salary_inr: string;
  years_of_service: string;
}

export function gratuityFormStorageKey(locale: Locale): string {
  return `${GRATUITY_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<GratuityFormPersistedState>): value is GratuityFormPersistedState {
  return (
    value.version === GRATUITY_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.last_drawn_salary_inr === "string" &&
    typeof value.years_of_service === "string"
  );
}

export function readGratuityFormState(locale: Locale): GratuityFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(gratuityFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GratuityFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeGratuityFormState(state: GratuityFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(gratuityFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}
