import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildCumulativeInterestCurve,
  buildPrincipalCurve,
  effectiveBrokerageLiquidUsd,
  effectiveGoldLiquidInr,
} from "../../../lib/loan";
import {
  downloadTextFile,
  scheduleToCsv,
  scenarioToJson,
  type ScenarioExportPayload,
} from "../../../lib/export";
import { parseScenarioImportJson } from "../../../lib/export/scenarioImport";
import {
  trackLoanExportScheduleCsv,
  trackLoanExportScenarioJson,
  trackLoanImportScenarioJson,
  trackLoanLoadReference,
  trackLoanStagedPrepayAdd,
  trackLoanStagedPrepayRemove,
} from "../../../lib/analytics";
import { EMPTY_LOAN_FORM } from "../../../lib/loan/loanFormFields";
import type { PrepaySource } from "../../../lib/loan/scenarioViews";
import { SCENARIO_LABELS, type ScenarioView } from "../../../lib/loan/scenarioViews";
import {
  newStagedPrepayEntry,
  parseStagedPrepays,
  type StagedPrepayEntry,
} from "../../../lib/loan/stagedPrepays";
import {
  LOAN_FORM_STORAGE_VERSION,
  readLoanFormState,
  writeLoanFormState,
} from "../../../lib/persistence/loanFormState";
import {
  loanInputSchema,
  type LoanInput,
} from "../../../lib/schemas/index";
import { computePfUnemploymentWithdrawalPlan } from "../../../lib/pf/index";
import { computeK401JobLossWithdrawalPlan } from "../../../lib/k401/index";
import {
  loanFormFromScenario,
  referenceScenarioForLocale,
  useLocale,
} from "../../locale/LocaleContext";
import { buildComparisonRows } from "./buildComparisonRows";
import { buildLoanModels } from "./buildLoanModels";
import {
  pfTrancheToLoanLabel,
  prepaySourceComparisonWord,
  prepaySourceHintLabel,
  prepaySourceScheduleLabel,
  scenarioViewIsAvailable,
} from "./loanModelHelpers";
import { resolveActiveBundle } from "./resolveActiveBundle";

export type { PrepaySource, ScenarioView };
export {
  pfTrancheToLoanLabel,
  prepaySourceComparisonWord,
  prepaySourceHintLabel,
  prepaySourceScheduleLabel,
};

function initialLoanState(locale: ReturnType<typeof useLocale>["locale"]) {
  const stored = readLoanFormState(locale);
  if (stored) {
    return {
      inputs: stored.inputs,
      scenarioView: stored.scenarioView,
      prepaySource: stored.prepaySource,
      stagedPrepays: stored.stagedPrepays,
    };
  }
  return {
    inputs: EMPTY_LOAN_FORM,
    scenarioView: "BASE" as ScenarioView,
    prepaySource: "cash" as PrepaySource,
    stagedPrepays: [] as StagedPrepayEntry[],
  };
}

export function useLoanModels() {
  const { locale } = useLocale();
  const skipPersistRef = useRef(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<keyof LoanInput, string>>(
    () => initialLoanState(locale).inputs,
  );
  const [scenarioView, setScenarioView] = useState<ScenarioView>(
    () => initialLoanState(locale).scenarioView,
  );
  const [prepaySource, setPrepaySource] = useState<PrepaySource>(
    () => initialLoanState(locale).prepaySource,
  );
  const [stagedPrepays, setStagedPrepays] = useState<StagedPrepayEntry[]>(
    () => initialLoanState(locale).stagedPrepays,
  );

  const parsed = useMemo(() => {
    return loanInputSchema.safeParse({
      principal_inr: inputs.principal_inr,
      annual_interest_rate: inputs.annual_interest_rate,
      tenure_months: inputs.tenure_months,
      start_date: inputs.start_date || undefined,
      cash_inr: inputs.cash_inr || 0,
      monthly_salary_inr: inputs.monthly_salary_inr || 0,
      pf_corpus_inr: inputs.pf_corpus_inr || 0,
      pf_annual_interest_rate_pct: inputs.pf_annual_interest_rate_pct || 0,
      monthly_pf_addition_inr: inputs.monthly_pf_addition_inr || 0,
      gold_liquid_inr: inputs.gold_liquid_inr || 0,
      gold_haircut_enabled: inputs.gold_haircut_enabled === "true",
      gold_haircut_pct: inputs.gold_haircut_pct || 0,
      monthly_cash_to_loan_inr: inputs.monthly_cash_to_loan_inr || 0,
      unemployment_mode: inputs.unemployment_mode === "true",
      unemployment_start_month: inputs.unemployment_start_month || 1,
      monthly_living_expense_inr: inputs.monthly_living_expense_inr || 0,
      monthly_income_inr: inputs.monthly_income_inr || 0,
      monthly_uib_inr: inputs.monthly_uib_inr || 0,
      vested_fraction_pct: inputs.vested_fraction_pct || 100,
      early_withdrawal_tax_withholding_pct:
        inputs.early_withdrawal_tax_withholding_pct || 22,
      employer_match_rate_pct: inputs.employer_match_rate_pct || 50,
      employer_match_cap_pct_of_salary:
        inputs.employer_match_cap_pct_of_salary || 6,
      annual_salary_inr: inputs.annual_salary_inr || 0,
      employment_type:
        inputs.employment_type === "self_employed" ? "self_employed" : "w2",
      pmi_monthly_inr: inputs.pmi_monthly_inr || 0,
      pmi_active: inputs.pmi_active !== "false",
      hsa_balance_inr: inputs.hsa_balance_inr || 0,
      monthly_health_premium_inr: inputs.monthly_health_premium_inr || 0,
    });
  }, [inputs]);

  const effectiveLiquidInr = useMemo(() => {
    if (!parsed.success) return 0;
    const v = parsed.data;
    if (locale === "US") {
      return effectiveBrokerageLiquidUsd(
        v.gold_liquid_inr,
        v.gold_haircut_enabled,
        v.gold_haircut_pct,
      );
    }
    return effectiveGoldLiquidInr(
      v.gold_liquid_inr,
      v.gold_haircut_enabled,
      v.gold_haircut_pct,
    );
  }, [parsed, locale]);

  const stagedEvents = useMemo(() => parseStagedPrepays(stagedPrepays), [stagedPrepays]);

  const models = useMemo(() => {
    if (!parsed.success) return null;
    return buildLoanModels(
      parsed.data,
      prepaySource,
      effectiveLiquidInr,
      stagedEvents,
      locale,
    );
  }, [parsed, prepaySource, effectiveLiquidInr, stagedEvents, locale]);

  useEffect(() => {
    if (!models) return;
    if (!scenarioViewIsAvailable(scenarioView, models)) {
      setScenarioView("BASE");
    }
  }, [models, scenarioView]);

  const baseInterest = models?.base.totals.total_interest_inr ?? 0;

  const comparisonRows = useMemo(
    () =>
      models
        ? buildComparisonRows(models, baseInterest, stagedEvents.length, locale)
        : [],
    [models, baseInterest, stagedEvents.length, locale],
  );

  const withdrawalPlan = useMemo(() => {
    if (!models) return null;
    if (locale === "US") {
      return computeK401JobLossWithdrawalPlan(
        models.v.pf_corpus_inr,
        models.v.vested_fraction_pct,
      );
    }
    return computePfUnemploymentWithdrawalPlan(
      models.v.pf_corpus_inr,
      models.v.pf_annual_interest_rate_pct,
      models.v.monthly_pf_addition_inr,
    );
  }, [models, locale]);

  const activeBundle = useMemo(
    () => (models ? resolveActiveBundle(models, scenarioView, locale) : null),
    [models, scenarioView, locale],
  );

  const activeRows = activeBundle?.rows ?? [];
  const activeCashBalances = activeBundle?.cashBalances;
  const activeWarnings = activeBundle?.warnings ?? [];
  const principalCurve = useMemo(
    () => buildPrincipalCurve(activeRows),
    [activeRows],
  );
  const interestCurve = useMemo(
    () => buildCumulativeInterestCurve(activeRows),
    [activeRows],
  );

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale,
      inputs,
      scenarioView,
      prepaySource,
      stagedPrepays,
    });
  }, [locale, inputs, scenarioView, prepaySource, stagedPrepays]);

  function setField<K extends keyof LoanInput>(key: K, value: string) {
    setImportError(null);
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function setBoolField(
    key: "gold_haircut_enabled" | "unemployment_mode" | "pmi_active",
    checked: boolean,
  ) {
    setImportError(null);
    setInputs((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
  }

  function applyLoanState(next: {
    inputs: Record<keyof LoanInput, string>;
    scenarioView: ScenarioView;
    prepaySource: PrepaySource;
    stagedPrepays: StagedPrepayEntry[];
  }) {
    skipPersistRef.current = true;
    setInputs(next.inputs);
    setScenarioView(next.scenarioView);
    setPrepaySource(next.prepaySource);
    setStagedPrepays(next.stagedPrepays);
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale,
      inputs: next.inputs,
      scenarioView: next.scenarioView,
      prepaySource: next.prepaySource,
      stagedPrepays: next.stagedPrepays,
    });
  }

  function loadReference() {
    setImportError(null);
    applyLoanState({
      inputs: loanFormFromScenario(referenceScenarioForLocale(locale)) as Record<
        keyof LoanInput,
        string
      >,
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
    });
    trackLoanLoadReference(locale);
  }

  const prevLocaleRef = useRef<typeof locale | null>(null);
  useEffect(() => {
    if (prevLocaleRef.current === null) {
      prevLocaleRef.current = locale;
      return;
    }
    if (prevLocaleRef.current === locale) return;
    prevLocaleRef.current = locale;
    setImportError(null);
    applyLoanState({
      inputs: loanFormFromScenario(referenceScenarioForLocale(locale)) as Record<
        keyof LoanInput,
        string
      >,
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
    });
  }, [locale]);

  function addStagedPrepay() {
    setStagedPrepays((prev) => [...prev, newStagedPrepayEntry()]);
    trackLoanStagedPrepayAdd();
  }

  function removeStagedPrepay(id: string) {
    setStagedPrepays((prev) => prev.filter((e) => e.id !== id));
    trackLoanStagedPrepayRemove();
  }

  function updateStagedPrepay(
    id: string,
    field: "month" | "amount_inr",
    value: string,
  ) {
    setStagedPrepays((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    );
  }

  function readImportFile(file: File): Promise<string> {
    if (typeof file.text === "function") {
      return file.text();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
      reader.readAsText(file);
    });
  }

  function importScenarioJson(file: File) {
    void readImportFile(file)
      .then((text) => {
        const outcome = parseScenarioImportJson(text, locale);
        if (!outcome.success) {
          setImportError(outcome.message);
          trackLoanImportScenarioJson(scenarioView, locale, false);
          return;
        }
        setImportError(null);
        applyLoanState({
          inputs: outcome.inputs,
          scenarioView: outcome.scenarioView,
          prepaySource: outcome.prepaySource,
          stagedPrepays: outcome.stagedPrepays,
        });
        trackLoanImportScenarioJson(outcome.scenarioView, locale, true);
      })
      .catch(() => {
        setImportError("Failed to read file.");
        trackLoanImportScenarioJson(scenarioView, locale, false);
      });
  }

  function exportScheduleCsv() {
    if (!models || !activeBundle) return;
    const csv = scheduleToCsv(activeRows, {
      includeCashBalance: activeCashBalances !== undefined,
      cashBalances: activeCashBalances,
      startDateIso: models.v.start_date,
    });
    const slug = SCENARIO_LABELS[scenarioView].toLowerCase();
    downloadTextFile(`loan-schedule-${slug}.csv`, csv, "text/csv;charset=utf-8");
    trackLoanExportScheduleCsv(scenarioView, locale);
  }

  function exportScenarioJson() {
    if (!models || !activeBundle) return;
    const comp = comparisonRows.find((r) => r.id === scenarioView);
    const payload: ScenarioExportPayload = {
      exported_at: new Date().toISOString(),
      locale,
      scenario_id: SCENARIO_LABELS[scenarioView],
      scenario_label: comp?.label ?? SCENARIO_LABELS[scenarioView],
      inputs: {
        ...models.v,
        prepay_source: prepaySource,
        staged_prepayments: stagedEvents,
        ...(locale === "US"
          ? { monthly_401k_with_match_inr: models.monthly401kWithMatch }
          : {}),
      },
      totals: {
        payoff_month: activeBundle.totals.payoff_month,
        total_interest_inr: activeBundle.totals.total_interest_inr,
        total_paid_inr: activeBundle.totals.total_paid_inr,
        total_prepayments_inr: activeBundle.totals.total_prepayments_inr,
        interest_delta_vs_base_inr: comp?.deltaInterestVsBase,
        min_cash_balance_inr: comp?.minCashBalance,
      },
      staged_prepayments: stagedEvents.length > 0 ? stagedEvents : undefined,
    };
    const slug = SCENARIO_LABELS[scenarioView].toLowerCase();
    downloadTextFile(
      `loan-scenario-${slug}.json`,
      scenarioToJson(payload),
      "application/json;charset=utf-8",
    );
    trackLoanExportScenarioJson(scenarioView, locale);
  }

  return {
    inputs,
    setField,
    setBoolField,
    loadReference,
    importScenarioJson,
    importError,
    parsed,
    locale,
    models,
    comparisonRows,
    withdrawalPlan,
    activeRows,
    activeCashBalances,
    activeWarnings,
    principalCurve,
    interestCurve,
    scenarioView,
    setScenarioView,
    prepaySource,
    setPrepaySource,
    effectiveLiquidInr,
    stagedPrepays,
    addStagedPrepay,
    removeStagedPrepay,
    updateStagedPrepay,
    exportScheduleCsv,
    exportScenarioJson,
  };
}
