import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALE_STORAGE_KEY,
  REFERENCE_SCENARIO_IN,
  REFERENCE_SCENARIO_US,
  REFERENCE_SCENARIO_UK,
  type Locale,
} from "../../lib/locale";
import { loanInputToFormFields } from "../../lib/loan/loanFormFields";
import { trackLocaleChange } from "../../lib/analytics";
import {
  REFERENCE_RETIREMENT_FORM_IN,
  REFERENCE_RETIREMENT_FORM_US,
  REFERENCE_RETIREMENT_FORM_UK,
} from "../../lib/retirement/constants";
import {
  REFERENCE_BUDGET_IN,
  REFERENCE_BUDGET_US,
  REFERENCE_BUDGET_UK,
} from "../../lib/budget/constants";

interface LocaleContextValue {
  locale: Locale;
  /** Increments on each confirmed locale switch so feature hooks can reset forms. */
  localeEpoch: number;
  setLocale: (next: Locale) => void;
  switchLocale: (next: Locale) => boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "IN";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "US") return "US";
  if (stored === "UK") return "UK";
  return "IN";
}

function localeSwitchMessage(next: Locale): string {
  if (next === "US") {
    return "Switch to United States (USD)? Form values will reset to the US reference scenario.";
  }
  if (next === "UK") {
    return "Switch to United Kingdom (GBP)? Form values will reset to the UK reference scenario.";
  }
  return "Switch to India (INR)? Form values will reset to the India reference scenario.";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);
  const [localeEpoch, setLocaleEpoch] = useState(0);

  const applyLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleEpoch((epoch) => epoch + 1);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    trackLocaleChange(next);
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      if (!window.confirm(localeSwitchMessage(next))) return;
      applyLocale(next);
    },
    [locale, applyLocale],
  );

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return true;
      if (!window.confirm(localeSwitchMessage(next))) return false;
      applyLocale(next);
      return true;
    },
    [locale, applyLocale],
  );

  const value = useMemo(
    () => ({ locale, localeEpoch, setLocale, switchLocale }),
    [locale, localeEpoch, setLocale, switchLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function referenceScenarioForLocale(locale: Locale) {
  if (locale === "US") return REFERENCE_SCENARIO_US;
  if (locale === "UK") return REFERENCE_SCENARIO_UK;
  return REFERENCE_SCENARIO_IN;
}

export function referenceRetirementFormForLocale(locale: Locale) {
  if (locale === "US") return REFERENCE_RETIREMENT_FORM_US;
  if (locale === "UK") return REFERENCE_RETIREMENT_FORM_UK;
  return REFERENCE_RETIREMENT_FORM_IN;
}

export function referenceBudgetForLocale(locale: Locale) {
  if (locale === "US") return REFERENCE_BUDGET_US;
  if (locale === "UK") return REFERENCE_BUDGET_UK;
  return REFERENCE_BUDGET_IN;
}

export function loanFormFromScenario(
  scenario: typeof REFERENCE_SCENARIO_IN,
): Record<string, string> {
  return loanInputToFormFields({
    ...scenario,
    unemployment_mode: false,
  });
}
