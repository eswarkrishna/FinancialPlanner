import type { Locale } from "../locale/types";
import type { StagedPrepayEntry } from "../loan/stagedPrepays";
import type { LoanInput } from "../schemas/index";
import type { PrepaySource, ScenarioView } from "../loan/scenarioViews";

export const LOAN_FORM_STORAGE_KEY = "financial-planner-loan-form";
export const LOAN_FORM_STORAGE_VERSION = 1;

export interface LoanFormPersistedState {
  version: typeof LOAN_FORM_STORAGE_VERSION;
  locale: Locale;
  inputs: Record<keyof LoanInput, string>;
  scenarioView: ScenarioView;
  prepaySource: PrepaySource;
  stagedPrepays: StagedPrepayEntry[];
}

export function readLoanFormState(locale: Locale): LoanFormPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOAN_FORM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LoanFormPersistedState>;
    if (parsed.version !== LOAN_FORM_STORAGE_VERSION) return null;
    if (parsed.locale !== locale) return null;
    if (!parsed.inputs || typeof parsed.inputs !== "object") return null;
    return parsed as LoanFormPersistedState;
  } catch {
    return null;
  }
}

export function writeLoanFormState(state: LoanFormPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOAN_FORM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or privacy mode — ignore.
  }
}

export function clearLoanFormState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOAN_FORM_STORAGE_KEY);
  } catch {
    // ignore
  }
}
