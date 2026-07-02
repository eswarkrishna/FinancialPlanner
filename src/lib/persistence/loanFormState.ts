import type { Locale } from "../locale/types";
import type { StagedPrepayEntry } from "../loan/stagedPrepays";
import {
  SCENARIO_LABELS,
  type PrepaySource,
  type ScenarioView,
} from "../loan/scenarioViews";
import type { LoanInput } from "../schemas/index";

/** Legacy single-key blob (v1.7); migrated to per-locale keys on read. */
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

export function loanFormStorageKey(locale: Locale): string {
  return `${LOAN_FORM_STORAGE_KEY}-${locale}`;
}

function isStagedPrepayEntry(value: unknown): value is StagedPrepayEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<StagedPrepayEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.month === "string" &&
    typeof entry.amount_inr === "string"
  );
}

function isValidScenarioView(value: unknown): value is ScenarioView {
  return typeof value === "string" && value in SCENARIO_LABELS;
}

function isValidPrepaySource(value: unknown): value is PrepaySource {
  return value === "cash" || value === "pf" || value === "gold";
}

function normalizeStagedPrepays(value: unknown): StagedPrepayEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStagedPrepayEntry);
}

function isValidPersistedState(value: Partial<LoanFormPersistedState>): value is LoanFormPersistedState {
  if (value.version !== LOAN_FORM_STORAGE_VERSION) return false;
  if (value.locale !== "IN" && value.locale !== "US") return false;
  if (!value.inputs || typeof value.inputs !== "object") return false;
  if (!isValidScenarioView(value.scenarioView)) return false;
  if (!isValidPrepaySource(value.prepaySource)) return false;
  if (!Array.isArray(value.stagedPrepays)) return false;
  if (!value.stagedPrepays.every(isStagedPrepayEntry)) return false;
  return true;
}

function normalizePersistedState(
  value: Partial<LoanFormPersistedState>,
  locale: Locale,
): LoanFormPersistedState | null {
  if (value.version !== LOAN_FORM_STORAGE_VERSION) return null;
  if (value.locale !== locale) return null;
  if (!value.inputs || typeof value.inputs !== "object") return null;
  if (!isValidScenarioView(value.scenarioView)) return null;
  if (!isValidPrepaySource(value.prepaySource)) return null;
  return {
    version: LOAN_FORM_STORAGE_VERSION,
    locale,
    inputs: value.inputs as Record<keyof LoanInput, string>,
    scenarioView: value.scenarioView,
    prepaySource: value.prepaySource,
    stagedPrepays: normalizeStagedPrepays(value.stagedPrepays),
  };
}

/** Migrate v1.7 single-key blob into per-locale keys without cross-locale overwrite. */
function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOAN_FORM_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<LoanFormPersistedState>;
    if (isValidPersistedState(parsed)) {
      window.localStorage.setItem(
        loanFormStorageKey(parsed.locale),
        JSON.stringify(parsed),
      );
    }
    window.localStorage.removeItem(LOAN_FORM_STORAGE_KEY);
  } catch {
    window.localStorage.removeItem(LOAN_FORM_STORAGE_KEY);
  }
}

export function readLoanFormState(locale: Locale): LoanFormPersistedState | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorage();
  try {
    const raw = window.localStorage.getItem(loanFormStorageKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LoanFormPersistedState>;
    return normalizePersistedState(parsed, locale);
  } catch {
    return null;
  }
}

export function writeLoanFormState(state: LoanFormPersistedState): void {
  if (typeof window === "undefined") return;
  if (!isValidPersistedState(state)) return;
  try {
    window.localStorage.setItem(
      loanFormStorageKey(state.locale),
      JSON.stringify(state),
    );
  } catch {
    // Quota or privacy mode — ignore.
  }
}

export function clearLoanFormState(locale?: Locale): void {
  if (typeof window === "undefined") return;
  try {
    if (locale) {
      window.localStorage.removeItem(loanFormStorageKey(locale));
      return;
    }
    window.localStorage.removeItem(loanFormStorageKey("IN"));
    window.localStorage.removeItem(loanFormStorageKey("US"));
    window.localStorage.removeItem(LOAN_FORM_STORAGE_KEY);
  } catch {
    // ignore
  }
}
