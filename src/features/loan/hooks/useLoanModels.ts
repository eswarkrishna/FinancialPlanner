import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildCumulativeInterestCurve,
  buildPrincipalCurve,
} from "../../../lib/loan";
import { isCurrentEmiTooLow } from "../../../lib/loan/emi";
import {
  downloadBlob,
  downloadTextFile,
  ImportFileTooLargeError,
  readImportTextFile,
  scheduleToCsv,
  scheduleToPdfBytes,
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
  newRateChangeEntry,
  parseRateChanges,
  type RateChangeEntry,
} from "../../../lib/loan/rateChanges";
import {
  LOAN_FORM_STORAGE_VERSION,
  readLoanFormState,
  writeLoanFormState,
} from "../../../lib/persistence/loanFormState";
import {
  deleteLoanScenarioSlot,
  readLoanScenarioSlots,
  saveLoanScenarioSlot,
  type LoanScenarioSlot,
} from "../../../lib/persistence/loanScenarioSlots";
import { buildScenarioSlotRows } from "./buildScenarioSlotRows";
import type { LoanInput } from "../../../lib/schemas/index";
import { effectiveLiquidForLocale, parseLoanForm } from "./parseLoanForm";
import { computePfUnemploymentWithdrawalPlan } from "../../../lib/pf/index";
import { computeK401JobLossWithdrawalPlan } from "../../../lib/k401/index";
import {
  loanFormFromScenario,
  referenceScenarioForLocale,
  useLocale,
} from "../../locale/LocaleContext";
import { buildComparisonRows, buildPrepayStrategyCompare } from "./buildComparisonRows";
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
      rateChanges: stored.rateChanges,
    };
  }
  return {
    inputs: EMPTY_LOAN_FORM,
    scenarioView: "BASE" as ScenarioView,
    prepaySource: "cash" as PrepaySource,
    stagedPrepays: [] as StagedPrepayEntry[],
    rateChanges: [] as RateChangeEntry[],
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
  const [rateChanges, setRateChanges] = useState<RateChangeEntry[]>(
    () => initialLoanState(locale).rateChanges,
  );
  const [scenarioSlots, setScenarioSlots] = useState<LoanScenarioSlot[]>(() =>
    readLoanScenarioSlots(locale),
  );
  const [slotError, setSlotError] = useState<string | null>(null);

  const parsed = useMemo(() => parseLoanForm(inputs), [inputs]);

  const effectiveLiquidInr = useMemo(() => {
    if (!parsed.success) return 0;
    return effectiveLiquidForLocale(parsed.data, locale);
  }, [parsed, locale]);

  const stagedEvents = useMemo(() => parseStagedPrepays(stagedPrepays), [stagedPrepays]);
  const parsedRateChanges = useMemo(() => parseRateChanges(rateChanges), [rateChanges]);

  const models = useMemo(() => {
    if (!parsed.success) return null;
    return buildLoanModels(
      parsed.data,
      prepaySource,
      effectiveLiquidInr,
      stagedEvents,
      locale,
      parsedRateChanges,
    );
  }, [parsed, prepaySource, effectiveLiquidInr, stagedEvents, locale, parsedRateChanges]);

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

  const prepayStrategyCompare = useMemo(
    () =>
      models ? buildPrepayStrategyCompare(models, baseInterest, locale) : null,
    [models, baseInterest, locale],
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
  const activeWarnings = useMemo(() => {
    const warnings = [...(activeBundle?.warnings ?? [])];
    if (
      parsed.success &&
      parsed.data.emi_basis === "current" &&
      isCurrentEmiTooLow(
        parsed.data.principal_inr,
        parsed.data.annual_interest_rate,
        parsed.data.current_emi_inr,
      )
    ) {
      warnings.push("CURRENT_EMI_TOO_LOW");
    }
    return warnings;
  }, [activeBundle, parsed]);
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
      rateChanges,
    });
  }, [locale, inputs, scenarioView, prepaySource, stagedPrepays, rateChanges]);

  function setField<K extends keyof LoanInput>(key: K, value: string) {
    setImportError(null);
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function setBoolField(
    key:
      | "gold_haircut_enabled"
      | "unemployment_mode"
      | "pmi_active"
      | "smi_enabled"
      | "rule_of_55_eligible"
      | "secure2_emergency_1k",
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
    rateChanges: RateChangeEntry[];
  }) {
    skipPersistRef.current = true;
    setInputs(next.inputs);
    setScenarioView(next.scenarioView);
    setPrepaySource(next.prepaySource);
    setStagedPrepays(next.stagedPrepays);
    setRateChanges(next.rateChanges);
    writeLoanFormState({
      version: LOAN_FORM_STORAGE_VERSION,
      locale,
      inputs: next.inputs,
      scenarioView: next.scenarioView,
      prepaySource: next.prepaySource,
      stagedPrepays: next.stagedPrepays,
      rateChanges: next.rateChanges,
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
      rateChanges: [],
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
    setSlotError(null);
    setScenarioSlots(readLoanScenarioSlots(locale));
    applyLoanState({
      inputs: loanFormFromScenario(referenceScenarioForLocale(locale)) as Record<
        keyof LoanInput,
        string
      >,
      scenarioView: "BASE",
      prepaySource: "cash",
      stagedPrepays: [],
      rateChanges: [],
    });
  }, [locale]);

  const scenarioSlotRows = useMemo(
    () => buildScenarioSlotRows(scenarioSlots, locale),
    [scenarioSlots, locale],
  );

  function saveScenarioSlot(name: string) {
    const result = saveLoanScenarioSlot(locale, name, {
      inputs,
      scenarioView,
      prepaySource,
      stagedPrepays,
      rateChanges,
    });
    if (!result.success) {
      setSlotError(
        result.reason === "SLOTS_FULL"
          ? "All 5 slots are used — delete a saved scenario or reuse an existing name."
          : "Enter a name for the scenario.",
      );
      return false;
    }
    setSlotError(null);
    setScenarioSlots(result.slots);
    return true;
  }

  function loadScenarioSlot(id: string) {
    const slot = scenarioSlots.find((entry) => entry.id === id);
    if (!slot) return;
    setSlotError(null);
    setImportError(null);
    applyLoanState(slot.state);
  }

  function deleteScenarioSlot(id: string) {
    setSlotError(null);
    setScenarioSlots(deleteLoanScenarioSlot(locale, id));
  }

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

  function addRateChange() {
    setRateChanges((prev) => [...prev, newRateChangeEntry()]);
  }

  function removeRateChange(id: string) {
    setRateChanges((prev) => prev.filter((entry) => entry.id !== id));
  }

  function updateRateChange(
    id: string,
    field: "month" | "annual_rate",
    value: string,
  ) {
    setRateChanges((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    );
  }

  function importScenarioJson(file: File) {
    void readImportTextFile(file)
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
          rateChanges: [],
        });
        trackLoanImportScenarioJson(outcome.scenarioView, locale, true);
      })
      .catch((error: unknown) => {
        setImportError(
          error instanceof ImportFileTooLargeError
            ? error.message
            : "Failed to read file.",
        );
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

  function exportSchedulePdf() {
    if (!models || !activeBundle) return;
    const bytes = scheduleToPdfBytes(activeRows, {
      includeCashBalance: activeCashBalances !== undefined,
      cashBalances: activeCashBalances,
      startDateIso: models.v.start_date,
      title: `Loan schedule — ${SCENARIO_LABELS[scenarioView]}`,
    });
    const slug = SCENARIO_LABELS[scenarioView].toLowerCase();
    downloadBlob(`loan-schedule-${slug}.pdf`, new Blob([bytes], { type: "application/pdf" }));
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
    prepayStrategyCompare,
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
    rateChanges,
    addRateChange,
    removeRateChange,
    updateRateChange,
    exportScheduleCsv,
    exportSchedulePdf,
    exportScenarioJson,
    scenarioSlots,
    scenarioSlotRows,
    slotError,
    saveScenarioSlot,
    loadScenarioSlot,
    deleteScenarioSlot,
  };
}
