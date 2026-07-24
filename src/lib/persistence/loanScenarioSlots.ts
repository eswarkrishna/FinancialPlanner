import type { Locale } from "../locale/types";
import {
  normalizeLoanFormSnapshot,
  type LoanFormSnapshot,
} from "./loanFormState";

/** Named loan scenario slots in localStorage (SPEC §4.9.1). */
export const LOAN_SCENARIO_SLOTS_KEY = "financial-planner-loan-scenarios";
export const LOAN_SCENARIO_SLOTS_VERSION = 1;
export const MAX_LOAN_SCENARIO_SLOTS = 5;
export const MAX_LOAN_SCENARIO_NAME_LENGTH = 40;

export interface LoanScenarioSlot {
  id: string;
  name: string;
  saved_at: string;
  state: LoanFormSnapshot;
}

export type SaveLoanScenarioSlotResult =
  | { success: true; slots: LoanScenarioSlot[] }
  | { success: false; reason: "EMPTY_NAME" | "SLOTS_FULL" };

export function loanScenarioSlotsKey(locale: Locale): string {
  return `${LOAN_SCENARIO_SLOTS_KEY}-${locale}`;
}

function normalizeSlot(value: unknown): LoanScenarioSlot | null {
  if (!value || typeof value !== "object") return null;
  const slot = value as Partial<LoanScenarioSlot>;
  if (typeof slot.id !== "string" || slot.id.length === 0) return null;
  if (typeof slot.name !== "string" || slot.name.trim().length === 0) return null;
  if (typeof slot.saved_at !== "string") return null;
  const state = normalizeLoanFormSnapshot(slot.state);
  if (!state) return null;
  return { id: slot.id, name: slot.name, saved_at: slot.saved_at, state };
}

export function readLoanScenarioSlots(locale: Locale): LoanScenarioSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(loanScenarioSlotsKey(locale));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as {
      version?: number;
      slots?: unknown[];
    };
    if (parsed.version !== LOAN_SCENARIO_SLOTS_VERSION) return [];
    if (!Array.isArray(parsed.slots)) return [];
    return parsed.slots
      .map(normalizeSlot)
      .filter((slot): slot is LoanScenarioSlot => slot !== null)
      .slice(0, MAX_LOAN_SCENARIO_SLOTS);
  } catch {
    return [];
  }
}

function writeSlots(locale: Locale, slots: LoanScenarioSlot[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      loanScenarioSlotsKey(locale),
      JSON.stringify({ version: LOAN_SCENARIO_SLOTS_VERSION, slots }),
    );
  } catch {
    // Quota or privacy mode — ignore.
  }
}

function newSlotId(): string {
  return `slot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Save the current form snapshot under a trimmed name. A name matching an
 * existing slot (case-insensitive) overwrites that slot; a new name appends
 * unless all slots are taken (§4.9.1).
 */
export function saveLoanScenarioSlot(
  locale: Locale,
  name: string,
  state: LoanFormSnapshot,
): SaveLoanScenarioSlotResult {
  const trimmed = name.trim().slice(0, MAX_LOAN_SCENARIO_NAME_LENGTH);
  if (trimmed.length === 0) {
    return { success: false, reason: "EMPTY_NAME" };
  }
  const slots = readLoanScenarioSlots(locale);
  const existingIndex = slots.findIndex(
    (slot) => slot.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const savedAt = new Date().toISOString();
  let next: LoanScenarioSlot[];
  if (existingIndex >= 0) {
    next = slots.map((slot, index) =>
      index === existingIndex
        ? { ...slot, name: trimmed, saved_at: savedAt, state }
        : slot,
    );
  } else {
    if (slots.length >= MAX_LOAN_SCENARIO_SLOTS) {
      return { success: false, reason: "SLOTS_FULL" };
    }
    next = [...slots, { id: newSlotId(), name: trimmed, saved_at: savedAt, state }];
  }
  writeSlots(locale, next);
  return { success: true, slots: next };
}

export function deleteLoanScenarioSlot(
  locale: Locale,
  id: string,
): LoanScenarioSlot[] {
  const next = readLoanScenarioSlots(locale).filter((slot) => slot.id !== id);
  writeSlots(locale, next);
  return next;
}
