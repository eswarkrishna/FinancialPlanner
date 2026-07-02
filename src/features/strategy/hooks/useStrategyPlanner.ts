import { useEffect, useMemo, useRef, useState } from "react";
import { simulateAllStrategies } from "../../../lib/strategy/simulate";
import {
  LTCG_EXEMPTION_INR,
  LTCG_RATE_PCT,
  LTCG_RATE_PCT_US,
  SUBSISTENCE_FLOOR_INR,
  SUBSISTENCE_FLOOR_USD,
} from "../../../lib/strategy/constants";
import {
  STRATEGY_TIER_PRESETS,
  STRATEGY_TIER_PRESETS_US,
  type StrategyInputs,
  type StrategyResult,
  type StrategyTierPreset,
} from "../../../lib/strategy/types";
import { useLocale } from "../../locale/LocaleContext";
import { trackStrategyTierPreset } from "../../../lib/analytics";

type StrategyFormState = {
  principal_inr: string;
  annual_interest_rate: string;
  tenure_months: string;
  cash_inr: string;
  pf_corpus_inr: string;
  pf_annual_interest_rate_pct: string;
  monthly_pf_addition_inr: string;
  monthly_take_home_inr: string;
  monthly_living_expense_inr: string;
  extra_monthly_income_inr: string;
  emergency_months_buffer: string;
  expected_equity_return_pct: string;
  horizon_months: string;
  repayment_pct_of_take_home: string;
  extra_income_post_tax: boolean | null;
  marginal_tax_rate_pct: string;
};

const EMPTY_FORM: StrategyFormState = {
  principal_inr: "",
  annual_interest_rate: "",
  tenure_months: "",
  cash_inr: "",
  pf_corpus_inr: "",
  pf_annual_interest_rate_pct: "",
  monthly_pf_addition_inr: "",
  monthly_take_home_inr: "",
  monthly_living_expense_inr: "",
  extra_monthly_income_inr: "",
  emergency_months_buffer: "",
  expected_equity_return_pct: "",
  horizon_months: "",
  repayment_pct_of_take_home: "",
  extra_income_post_tax: null,
  marginal_tax_rate_pct: "",
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function strategyFormReady(form: StrategyFormState): boolean {
  if (
    !form.principal_inr.trim() ||
    !form.annual_interest_rate.trim() ||
    !form.tenure_months.trim() ||
    !form.horizon_months.trim()
  ) {
    return false;
  }
  const principal = parseNumber(form.principal_inr);
  const tenure = Math.floor(parseNumber(form.tenure_months));
  const horizon = Math.floor(parseNumber(form.horizon_months));
  return principal > 0 && tenure > 0 && horizon > 0;
}

function buildInputs(form: StrategyFormState, locale: "IN" | "US"): StrategyInputs {
  const postTax = form.extra_income_post_tax ?? false;
  return {
    principal_inr: Math.max(0, parseNumber(form.principal_inr)),
    annual_interest_rate: Math.max(0, parseNumber(form.annual_interest_rate)),
    tenure_months: Math.max(1, Math.floor(parseNumber(form.tenure_months))),
    cash_inr: Math.max(0, parseNumber(form.cash_inr)),
    pf_corpus_inr: Math.max(0, parseNumber(form.pf_corpus_inr)),
    pf_annual_interest_rate_pct: Math.max(
      0,
      parseNumber(form.pf_annual_interest_rate_pct),
    ),
    monthly_pf_addition_inr: Math.max(0, parseNumber(form.monthly_pf_addition_inr)),
    monthly_take_home_inr: Math.max(0, parseNumber(form.monthly_take_home_inr)),
    monthly_living_expense_inr: Math.max(
      0,
      parseNumber(form.monthly_living_expense_inr),
    ),
    extra_monthly_income_inr: Math.max(
      0,
      parseNumber(form.extra_monthly_income_inr),
    ),
    extra_income_post_tax: postTax,
    marginal_tax_rate_pct: Math.max(0, parseNumber(form.marginal_tax_rate_pct)),
    emergency_months_buffer: Math.max(
      0,
      Math.floor(parseNumber(form.emergency_months_buffer)),
    ),
    expected_equity_return_pct: Math.max(
      0,
      parseNumber(form.expected_equity_return_pct),
    ),
    horizon_months: Math.max(1, Math.floor(parseNumber(form.horizon_months))),
    repayment_pct_of_take_home: Math.max(
      0,
      parseNumber(form.repayment_pct_of_take_home),
    ),
    subsistence_floor_inr:
      locale === "US" ? SUBSISTENCE_FLOOR_USD : SUBSISTENCE_FLOOR_INR,
    ltcg_rate_pct: locale === "US" ? LTCG_RATE_PCT_US : LTCG_RATE_PCT,
    ltcg_exemption_inr: locale === "US" ? 0 : LTCG_EXEMPTION_INR,
  };
}

export function useStrategyPlanner() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<StrategyFormState>(EMPTY_FORM);

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(EMPTY_FORM);
  }, [localeEpoch]);

  const ready = strategyFormReady(form);
  const inputs = useMemo(() => buildInputs(form, locale), [form, locale]);
  const results = useMemo((): StrategyResult[] => {
    if (!ready) return [];
    return simulateAllStrategies(inputs);
  }, [inputs, ready]);

  function setField<K extends keyof StrategyFormState>(
    key: K,
    value: StrategyFormState[K],
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyTierPreset(preset: StrategyTierPreset): void {
    setForm((prev) => ({
      ...prev,
      monthly_take_home_inr: String(preset.monthly_take_home_inr),
    }));
    trackStrategyTierPreset(preset.id, locale);
  }

  return {
    form,
    setField,
    inputs,
    results,
    strategyFormReady: ready,
    locale,
    tierPresets: locale === "US" ? STRATEGY_TIER_PRESETS_US : STRATEGY_TIER_PRESETS,
    applyTierPreset,
  };
}
