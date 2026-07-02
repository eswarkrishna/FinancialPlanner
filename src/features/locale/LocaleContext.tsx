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
  type Locale,
} from "../../lib/locale";
import {
  REFERENCE_RETIREMENT_FORM_IN,
  REFERENCE_RETIREMENT_FORM_US,
} from "../../lib/retirement/constants";

interface LocaleContextValue {
  locale: Locale;
  /** Increments on each confirmed locale switch so feature hooks can reset forms. */
  localeEpoch: number;
  setLocale: (next: Locale) => void;
  switchLocale: (next: Locale) => boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "IN";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "US" ? "US" : "IN";
}

function localeSwitchMessage(next: Locale): string {
  return next === "US"
    ? "Switch to United States (USD)? Form values will reset to the US reference scenario."
    : "Switch to India (INR)? Form values will reset to the India reference scenario.";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);
  const [localeEpoch, setLocaleEpoch] = useState(0);

  const applyLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleEpoch((epoch) => epoch + 1);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
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
  return locale === "US" ? REFERENCE_SCENARIO_US : REFERENCE_SCENARIO_IN;
}

export function referenceRetirementFormForLocale(locale: Locale) {
  return locale === "US"
    ? REFERENCE_RETIREMENT_FORM_US
    : REFERENCE_RETIREMENT_FORM_IN;
}

export function loanFormFromScenario(
  scenario: typeof REFERENCE_SCENARIO_IN,
): Record<string, string> {
  return {
    principal_inr: String(scenario.principal_inr),
    annual_interest_rate: String(scenario.annual_interest_rate),
    tenure_months: String(scenario.tenure_months),
    start_date: scenario.start_date ?? "",
    cash_inr: String(scenario.cash_inr),
    monthly_salary_inr: String(scenario.monthly_salary_inr),
    annual_salary_inr: String(scenario.annual_salary_inr ?? 0),
    pf_corpus_inr: String(scenario.pf_corpus_inr),
    pf_annual_interest_rate_pct: String(scenario.pf_annual_interest_rate_pct),
    monthly_pf_addition_inr: String(scenario.monthly_pf_addition_inr),
    gold_liquid_inr: String(scenario.gold_liquid_inr),
    gold_haircut_enabled: scenario.gold_haircut_enabled ? "true" : "false",
    gold_haircut_pct: String(scenario.gold_haircut_pct ?? 0),
    monthly_cash_to_loan_inr: String(scenario.monthly_cash_to_loan_inr),
    unemployment_mode: "false",
    unemployment_start_month: String(scenario.unemployment_start_month),
    monthly_living_expense_inr: String(scenario.monthly_living_expense_inr),
    monthly_income_inr: String(scenario.monthly_income_inr),
    monthly_uib_inr: String(scenario.monthly_uib_inr ?? 0),
    vested_fraction_pct: String(scenario.vested_fraction_pct ?? 100),
    early_withdrawal_tax_withholding_pct: String(
      scenario.early_withdrawal_tax_withholding_pct ?? 22,
    ),
    employer_match_rate_pct: String(scenario.employer_match_rate_pct ?? 50),
    employer_match_cap_pct_of_salary: String(
      scenario.employer_match_cap_pct_of_salary ?? 6,
    ),
    employment_type: scenario.employment_type ?? "w2",
    pmi_monthly_inr: String(scenario.pmi_monthly_inr ?? 0),
    pmi_active: scenario.pmi_active === false ? "false" : "true",
    hsa_balance_inr: String(scenario.hsa_balance_inr ?? 0),
    monthly_health_premium_inr: String(scenario.monthly_health_premium_inr ?? 0),
  };
}
