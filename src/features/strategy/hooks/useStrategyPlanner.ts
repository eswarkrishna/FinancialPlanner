import { useEffect, useMemo, useRef, useState } from "react";
import { simulateAllStrategies } from "../../../lib/strategy/simulate";
import { simulateAllStrategiesUk } from "../../../lib/strategy/simulateUk";
import {
  LTCG_EXEMPTION_INR,
  LTCG_RATE_PCT,
  LTCG_RATE_PCT_US,
  SUBSISTENCE_FLOOR_INR,
  SUBSISTENCE_FLOOR_USD,
  SUBSISTENCE_FLOOR_GBP,
} from "../../../lib/strategy/constants";
import {
  STRATEGY_TIER_PRESETS,
  STRATEGY_TIER_PRESETS_US,
  STRATEGY_TIER_PRESETS_UK,
  type StrategyInputs,
  type StrategyResult,
  type StrategyTierPreset,
} from "../../../lib/strategy/types";
import type { Locale } from "../../../lib/locale/types";
import { useLocale } from "../../locale/LocaleContext";
import {
  trackStrategyExportComparisonCsv,
  trackStrategyExportJson,
  trackStrategyTierPreset,
} from "../../../lib/analytics";
import {
  downloadTextFile,
  ImportFileTooLargeError,
  parseStrategyImportJson,
  readImportTextFile,
  strategyComparisonToCsv,
  strategyResultToJson,
} from "../../../lib/export";
import {
  readStrategyFormState,
  writeStrategyFormState,
} from "../../../lib/persistence/strategyFormState";

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

function buildInputs(form: StrategyFormState, locale: Locale): StrategyInputs {
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
      locale === "US"
        ? SUBSISTENCE_FLOOR_USD
        : locale === "UK"
          ? SUBSISTENCE_FLOOR_GBP
          : SUBSISTENCE_FLOOR_INR,
    ltcg_rate_pct:
      locale === "US" ? LTCG_RATE_PCT_US : locale === "UK" ? 24 : LTCG_RATE_PCT,
    ltcg_exemption_inr:
      locale === "US" ? 0 : locale === "UK" ? 3_000 : LTCG_EXEMPTION_INR,
    isa_annual_allowance_inr: locale === "UK" ? 20_000 : undefined,
    erc_overpayment_allowance_pct: locale === "UK" ? 10 : undefined,
    erc_pct: locale === "UK" ? 0 : undefined,
    pension_annual_return_pct: locale === "UK" ? 5 : undefined,
  };
}

function formFromPersisted(locale: Locale): StrategyFormState {
  const stored = readStrategyFormState(locale);
  if (!stored) return EMPTY_FORM;
  return {
    principal_inr: stored.principal_inr,
    annual_interest_rate: stored.annual_interest_rate,
    tenure_months: stored.tenure_months,
    cash_inr: stored.cash_inr,
    pf_corpus_inr: stored.pf_corpus_inr,
    pf_annual_interest_rate_pct: stored.pf_annual_interest_rate_pct,
    monthly_pf_addition_inr: stored.monthly_pf_addition_inr,
    monthly_take_home_inr: stored.monthly_take_home_inr,
    monthly_living_expense_inr: stored.monthly_living_expense_inr,
    extra_monthly_income_inr: stored.extra_monthly_income_inr,
    emergency_months_buffer: stored.emergency_months_buffer,
    expected_equity_return_pct: stored.expected_equity_return_pct,
    horizon_months: stored.horizon_months,
    repayment_pct_of_take_home: stored.repayment_pct_of_take_home,
    extra_income_post_tax: stored.extra_income_post_tax,
    marginal_tax_rate_pct: stored.marginal_tax_rate_pct,
  };
}

export function useStrategyPlanner() {
  const { locale, localeEpoch } = useLocale();
  const [form, setForm] = useState<StrategyFormState>(() => formFromPersisted(locale));
  const [importError, setImportError] = useState<string | null>(null);

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setForm(formFromPersisted(locale));
    setImportError(null);
  }, [localeEpoch, locale]);

  useEffect(() => {
    writeStrategyFormState({
      version: 1,
      locale,
      ...form,
    });
  }, [locale, form]);

  const ready = strategyFormReady(form);
  const inputs = useMemo(() => buildInputs(form, locale), [form, locale]);
  const results = useMemo((): StrategyResult[] => {
    if (!ready) return [];
    return locale === "UK"
      ? simulateAllStrategiesUk(inputs)
      : simulateAllStrategies(inputs);
  }, [inputs, ready, locale]);

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

  function importStrategyJson(file: File): void {
    setImportError(null);
    void readImportTextFile(file)
      .then((text) => {
        const outcome = parseStrategyImportJson(text, locale);
        if (!outcome.success) {
          setImportError(outcome.message);
          return;
        }
        setForm(outcome.form);
      })
      .catch((error: unknown) => {
        setImportError(
          error instanceof ImportFileTooLargeError
            ? error.message
            : "Could not read the selected file.",
        );
      });
  }

  function exportStrategyComparisonCsv(): void {
    if (!ready || results.length === 0) return;
    const csv = strategyComparisonToCsv(results);
    downloadTextFile(
      "strategy-comparison.csv",
      csv,
      "text/csv;charset=utf-8",
    );
    trackStrategyExportComparisonCsv(locale);
  }

  function exportStrategyJson(): void {
    if (!ready || results.length === 0) return;
    const json = strategyResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs,
      results,
    });
    downloadTextFile(
      "strategy-planner.json",
      json,
      "application/json;charset=utf-8",
    );
    trackStrategyExportJson(locale);
  }

  return {
    form,
    setField,
    inputs,
    results,
    strategyFormReady: ready,
    locale,
    tierPresets:
      locale === "US"
        ? STRATEGY_TIER_PRESETS_US
        : locale === "UK"
          ? STRATEGY_TIER_PRESETS_UK
          : STRATEGY_TIER_PRESETS,
    applyTierPreset,
    exportStrategyComparisonCsv,
    exportStrategyJson,
    importStrategyJson,
    importError,
  };
}
