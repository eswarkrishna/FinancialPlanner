import type { Locale } from "../locale/types";

export const SIP_FORM_STORAGE_KEY = "financial-planner-sip-form";
export const SIP_FORM_STORAGE_VERSION = 1;

export interface SipFormPersistedState {
  version: typeof SIP_FORM_STORAGE_VERSION;
  locale: Locale;
  opening_balance_inr: string;
  monthly_investment_inr: string;
  expected_annual_return_pct: string;
  years: string;
}

export function sipFormStorageKey(locale: Locale): string {
  return `${SIP_FORM_STORAGE_KEY}-${locale}`;
}

function isValidState(value: Partial<SipFormPersistedState>): value is SipFormPersistedState {
  return (
    value.version === SIP_FORM_STORAGE_VERSION &&
    (value.locale === "IN" || value.locale === "US" || value.locale === "UK") &&
    typeof value.opening_balance_inr === "string" &&
    typeof value.monthly_investment_inr === "string" &&
    typeof value.expected_annual_return_pct === "string" &&
    typeof value.years === "string"
  );
}

export function readSipFormState(locale: Locale): SipFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(sipFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SipFormPersistedState>;
    if (!isValidState(parsed) || parsed.locale !== locale) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSipFormState(state: SipFormPersistedState): void {
  if (typeof window === "undefined" || !isValidState(state)) return;
  try {
    window.localStorage.setItem(sipFormStorageKey(state.locale), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearSipFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(sipFormStorageKey(locale));
      return;
    }
    (["IN", "US", "UK"] as const).forEach((l) =>
      window.localStorage.removeItem(sipFormStorageKey(l)),
    );
  } catch {
    // ignore
  }
}
