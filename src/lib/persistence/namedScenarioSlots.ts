import type { Locale } from "../locale/types";

export const NAMED_SCENARIO_SLOT_VERSION = 1;
export const MAX_NAMED_SCENARIO_SLOTS = 5;

export interface NamedScenarioSlot<T> {
  id: string;
  name: string;
  savedAt: string;
  locale: Locale;
  payload: T;
  /** Optional KPI snapshot for compare table without re-simulation. */
  summary?: Record<string, string>;
}

export interface NamedScenarioStore<T> {
  version: typeof NAMED_SCENARIO_SLOT_VERSION;
  tab: string;
  locale: Locale;
  slots: NamedScenarioSlot<T>[];
}

function storageKey(tab: string, locale: Locale): string {
  return `financial-planner-named-scenarios-${tab}-${locale}`;
}

function normalizeStore<T>(
  raw: unknown,
  tab: string,
  locale: Locale,
): NamedScenarioStore<T> | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<NamedScenarioStore<T>>;
  if (value.version !== NAMED_SCENARIO_SLOT_VERSION) return null;
  if (value.tab !== tab || value.locale !== locale) return null;
  if (!Array.isArray(value.slots)) return null;
  const slots = value.slots
    .filter(
      (slot): slot is NamedScenarioSlot<T> =>
        !!slot &&
        typeof slot === "object" &&
        typeof (slot as NamedScenarioSlot<T>).id === "string" &&
        typeof (slot as NamedScenarioSlot<T>).name === "string" &&
        (slot as NamedScenarioSlot<T>).payload !== undefined,
    )
    .slice(0, MAX_NAMED_SCENARIO_SLOTS);
  return { version: NAMED_SCENARIO_SLOT_VERSION, tab, locale, slots };
}

export function readNamedScenarioSlots<T>(tab: string, locale: Locale): NamedScenarioSlot<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(tab, locale));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStore<T>(parsed, tab, locale)?.slots ?? [];
  } catch {
    return [];
  }
}

export function writeNamedScenarioSlots<T>(
  tab: string,
  locale: Locale,
  slots: NamedScenarioSlot<T>[],
): void {
  if (typeof window === "undefined") return;
  const store: NamedScenarioStore<T> = {
    version: NAMED_SCENARIO_SLOT_VERSION,
    tab,
    locale,
    slots: slots.slice(0, MAX_NAMED_SCENARIO_SLOTS),
  };
  try {
    window.localStorage.setItem(storageKey(tab, locale), JSON.stringify(store));
  } catch {
    // quota / privacy mode
  }
}

export function upsertNamedScenarioSlot<T>(
  tab: string,
  locale: Locale,
  slot: NamedScenarioSlot<T>,
): NamedScenarioSlot<T>[] {
  const existing = readNamedScenarioSlots<T>(tab, locale);
  const without = existing.filter((entry) => entry.id !== slot.id);
  const next = [...without, slot].slice(-MAX_NAMED_SCENARIO_SLOTS);
  writeNamedScenarioSlots(tab, locale, next);
  return next;
}

export function deleteNamedScenarioSlot<T>(
  tab: string,
  locale: Locale,
  id: string,
): NamedScenarioSlot<T>[] {
  const next = readNamedScenarioSlots<T>(tab, locale).filter((slot) => slot.id !== id);
  writeNamedScenarioSlots(tab, locale, next);
  return next;
}

export function newScenarioSlotId(): string {
  return `slot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
