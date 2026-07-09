import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildRetirementScenarios,
  DEFAULT_SAFE_WITHDRAWAL_RATE_PCT,
  REFERENCE_RETIREMENT_FORM_IN,
  REFERENCE_RETIREMENT_FORM_US,
  type RetirementInput,
} from "../../../lib/retirement/index";
import {
  downloadTextFile,
  retirementResultToJson,
  retirementTimelineToCsv,
  parseRetirementImportJson,
} from "../../../lib/export";
import {
  readRetirementFormState,
  writeRetirementFormState,
} from "../../../lib/persistence/retirementFormState";
import {
  trackRetirementExportJson,
  trackRetirementExportTimelineCsv,
} from "../../../lib/analytics";
import {
  readStoredLocale,
  referenceRetirementFormForLocale,
  useLocale,
} from "../../locale/LocaleContext";

type RetirementFormState = {
  current_corpus_inr: string;
  monthly_contribution_inr: string;
  annual_return_pct: string;
  inflation_pct: string;
  years_to_retirement: string;
  annual_expense_today_inr: string;
  safe_withdrawal_rate_pct: string;
  expected_social_security_monthly_inr: string;
};

function parseNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formFromPersisted(
  locale: import("../../../lib/locale/types").Locale,
): RetirementFormState {
  const stored = readRetirementFormState(locale);
  if (stored) {
    return {
      current_corpus_inr: stored.current_corpus_inr,
      monthly_contribution_inr: stored.monthly_contribution_inr,
      annual_return_pct: stored.annual_return_pct,
      inflation_pct: stored.inflation_pct,
      years_to_retirement: stored.years_to_retirement,
      annual_expense_today_inr: stored.annual_expense_today_inr,
      safe_withdrawal_rate_pct: stored.safe_withdrawal_rate_pct,
      expected_social_security_monthly_inr: stored.expected_social_security_monthly_inr,
    };
  }
  return referenceRetirementFormForLocale(locale);
}

export function useRetirementPlanner() {
  const { locale, localeEpoch } = useLocale();
  const [retirementInputs, setRetirementInputs] = useState<RetirementFormState>(
    () => formFromPersisted(readStoredLocale()),
  );
  const [selectedRetirementScenario, setSelectedRetirementScenario] = useState(
    () => readRetirementFormState(readStoredLocale())?.selected_scenario_id ?? "base",
  );
  const [importError, setImportError] = useState<string | null>(null);

  const prevLocaleEpochRef = useRef(localeEpoch);
  useEffect(() => {
    if (prevLocaleEpochRef.current === localeEpoch) return;
    prevLocaleEpochRef.current = localeEpoch;
    setRetirementInputs(formFromPersisted(locale));
    setSelectedRetirementScenario(
      readRetirementFormState(locale)?.selected_scenario_id ?? "base",
    );
    setImportError(null);
  }, [locale, localeEpoch]);

  useEffect(() => {
    writeRetirementFormState({
      version: 1,
      locale,
      ...retirementInputs,
      selected_scenario_id: selectedRetirementScenario,
    });
  }, [locale, retirementInputs, selectedRetirementScenario]);

  const yearsInvalid = useMemo(() => {
    const raw = retirementInputs.years_to_retirement.trim();
    if (raw === "") return true;
    const years = Math.floor(parseNumber(raw));
    return years < 1;
  }, [retirementInputs.years_to_retirement]);

  const retirementBaseInput = useMemo((): RetirementInput | null => {
    if (yearsInvalid) return null;
    const swrRaw = retirementInputs.safe_withdrawal_rate_pct.trim();
    const swr =
      swrRaw === ""
        ? DEFAULT_SAFE_WITHDRAWAL_RATE_PCT
        : Math.max(0.1, parseNumber(swrRaw));
    return {
      current_corpus_inr: Math.max(
        0,
        parseNumber(retirementInputs.current_corpus_inr),
      ),
      monthly_contribution_inr: Math.max(
        0,
        parseNumber(retirementInputs.monthly_contribution_inr),
      ),
      annual_return_pct: Math.max(
        0,
        parseNumber(retirementInputs.annual_return_pct),
      ),
      inflation_pct: Math.max(0, parseNumber(retirementInputs.inflation_pct)),
      years_to_retirement: Math.max(
        1,
        Math.floor(parseNumber(retirementInputs.years_to_retirement)),
      ),
      annual_expense_today_inr: Math.max(
        0,
        parseNumber(retirementInputs.annual_expense_today_inr),
      ),
      safe_withdrawal_rate_pct: swr,
      expected_social_security_monthly_inr: Math.max(
        0,
        parseNumber(retirementInputs.expected_social_security_monthly_inr),
      ),
      social_security_is_weekly: locale === "UK",
    };
  }, [retirementInputs, yearsInvalid, locale]);

  const retirementScenarios = useMemo(() => {
    if (!retirementBaseInput) return [];
    return buildRetirementScenarios(retirementBaseInput);
  }, [retirementBaseInput]);

  useEffect(() => {
    if (retirementScenarios.length === 0) return;
    if (!retirementScenarios.some((s) => s.id === selectedRetirementScenario)) {
      setSelectedRetirementScenario(retirementScenarios[0]!.id);
    }
  }, [retirementScenarios, selectedRetirementScenario]);

  const activeRetirementScenario =
    retirementScenarios.find(
      (scenario) => scenario.id === selectedRetirementScenario,
    ) ?? retirementScenarios[0];

  function setRetirementField(
    key: keyof RetirementFormState,
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const value = event.target.value;
    setRetirementInputs((prev) => ({ ...prev, [key]: value }));
  }

  function importRetirementJson(file: File): void {
    setImportError(null);
    void file
      .text()
      .then((text) => {
        const outcome = parseRetirementImportJson(text, locale);
        if (!outcome.success) {
          setImportError(outcome.message);
          return;
        }
        const { selectedRetirementScenario: scenario, ...form } = outcome;
        setRetirementInputs(form);
        setSelectedRetirementScenario(scenario);
      })
      .catch(() => {
        setImportError("Could not read the selected file.");
      });
  }

  function exportRetirementTimelineCsv(): void {
    if (!activeRetirementScenario) return;
    const csv = retirementTimelineToCsv(activeRetirementScenario.projection.yearly);
    downloadTextFile(
      `retirement-timeline-${selectedRetirementScenario}.csv`,
      csv,
      "text/csv;charset=utf-8",
    );
    trackRetirementExportTimelineCsv(selectedRetirementScenario, locale);
  }

  function exportRetirementJson(): void {
    if (!retirementBaseInput) return;
    const json = retirementResultToJson({
      exported_at: new Date().toISOString(),
      locale,
      inputs: { ...retirementBaseInput },
      scenarios: retirementScenarios,
      selected_scenario_id: selectedRetirementScenario,
    });
    downloadTextFile(
      `retirement-planner-${selectedRetirementScenario}.json`,
      json,
      "application/json;charset=utf-8",
    );
    trackRetirementExportJson(selectedRetirementScenario, locale);
  }

  return {
    retirementInputs,
    selectedRetirementScenario,
    setSelectedRetirementScenario,
    retirementScenarios,
    activeRetirementScenario,
    retirementBaseInput,
    setRetirementField,
    formatPercent,
    yearsInvalid,
    exportRetirementTimelineCsv,
    exportRetirementJson,
    importRetirementJson,
    importError,
  };
}

export {
  REFERENCE_RETIREMENT_FORM_IN,
  REFERENCE_RETIREMENT_FORM_US,
};
