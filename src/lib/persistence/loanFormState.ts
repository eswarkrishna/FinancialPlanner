import type { Locale } from "../locale/types";
import type { StagedPrepayEntry } from "../loan/stagedPrepays";
import type { RateChangeEntry } from "../loan/rateChanges";
import {
  SCENARIO_LABELS,
  type PrepaySource,
  type ScenarioView,
} from "../loan/scenarioViews";
import { EMPTY_LOAN_FORM } from "../loan/loanFormFields";
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
  rateChanges: RateChangeEntry[];
}

export function loanFormStorageKey(locale: Locale): string {
  return `${LOAN_FORM_STORAGE_KEY}-${locale}`;
}

/** The loan form snapshot persisted per locale and inside scenario slots (§4.9.1). */
export type LoanFormSnapshot = Omit<LoanFormPersistedState, "version" | "locale">;

function isRateChangeEntry(value: unknown): value is RateChangeEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<RateChangeEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.month === "string" &&
    typeof entry.annual_rate === "string"
  );
}

function normalizeRateChanges(value: unknown): RateChangeEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRateChangeEntry);
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
  return (
    value === "cash" ||
    value === "pf" ||
    value === "gold" ||
    value === "isa" ||
    value === "gia"
  );
}

function normalizeStagedPrepays(value: unknown): StagedPrepayEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStagedPrepayEntry);
}

function isValidPersistedState(value: Partial<LoanFormPersistedState>): value is LoanFormPersistedState {
  if (value.version !== LOAN_FORM_STORAGE_VERSION) return false;
  if (value.locale !== "IN" && value.locale !== "US" && value.locale !== "UK") return false;
  if (!value.inputs || typeof value.inputs !== "object") return false;
  if (!isValidScenarioView(value.scenarioView)) return false;
  if (!isValidPrepaySource(value.prepaySource)) return false;
  if (!Array.isArray(value.stagedPrepays)) return false;
  if (!value.stagedPrepays.every(isStagedPrepayEntry)) return false;
  if (value.rateChanges !== undefined) {
    if (!Array.isArray(value.rateChanges)) return false;
    if (!value.rateChanges.every(isRateChangeEntry)) return false;
  }
  return true;
}

/** Validate and normalise a bare form snapshot (shared with scenario slots, §4.9.1). */
export function normalizeLoanFormSnapshot(value: unknown): LoanFormSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as Partial<LoanFormSnapshot>;
  if (!snapshot.inputs || typeof snapshot.inputs !== "object") return null;
  if (!isValidScenarioView(snapshot.scenarioView)) return null;
  if (!isValidPrepaySource(snapshot.prepaySource)) return null;
  const mergedInputs = { ...EMPTY_LOAN_FORM };
  for (const key of Object.keys(EMPTY_LOAN_FORM) as (keyof LoanInput)[]) {
    const raw = (snapshot.inputs as Record<string, unknown>)[key];
    if (raw !== undefined && raw !== null) {
      mergedInputs[key] = String(raw);
    }
  }

  return {
    inputs: mergedInputs,
    scenarioView: snapshot.scenarioView,
    prepaySource: snapshot.prepaySource,
    stagedPrepays: normalizeStagedPrepays(snapshot.stagedPrepays),
    rateChanges: normalizeRateChanges(snapshot.rateChanges),
  };
}

function normalizePersistedState(
  value: Partial<LoanFormPersistedState>,
  locale: Locale,
): LoanFormPersistedState | null {
  if (value.version !== LOAN_FORM_STORAGE_VERSION) return null;
  if (value.locale !== locale) return null;
  const snapshot = normalizeLoanFormSnapshot(value);
  if (!snapshot) return null;

  return {
    version: LOAN_FORM_STORAGE_VERSION,
    locale,
    ...snapshot,
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
    window.localStorage.removeItem(loanFormStorageKey("UK"));
    window.localStorage.removeItem(LOAN_FORM_STORAGE_KEY);
  } catch {
    // ignore
  }
}
